<?php
header('Content-Type: application/json');
require_once '../config.php';

session_start();
$response = ['success' => false, 'message' => ''];

// Check authentication
if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'Authentication required';
    echo json_encode($response);
    exit;
}

$user_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['action'])) {
        switch ($data['action']) {
            case 'get_plans':
                $plans = [
                    'monthly' => [
                        'name' => 'Monthly Plan',
                        'price' => MONTHLY_PRICE,
                        'period' => 'month',
                        'features' => [
                            'All 10 advanced scanners',
                            'Real-time market data',
                            'Historical backtesting',
                            'Results database storage',
                            'Email & SMS alerts',
                            'Priority support'
                        ]
                    ],
                    'quarterly' => [
                        'name' => 'Quarterly Plan',
                        'price' => QUARTERLY_PRICE,
                        'period' => '3 months',
                        'savings' => round((1 - (QUARTERLY_PRICE / (3 * MONTHLY_PRICE))) * 100, 0),
                        'features' => [
                            'Everything in Monthly',
                            '20% more daily scans',
                            'Extended backtesting period',
                            'Advanced analytics'
                        ]
                    ],
                    'annual' => [
                        'name' => 'Annual Plan',
                        'price' => ANNUAL_PRICE,
                        'period' => 'year',
                        'savings' => round((1 - (ANNUAL_PRICE / (12 * MONTHLY_PRICE))) * 100, 0),
                        'features' => [
                            'Everything in Quarterly',
                            'Custom scanner development',
                            'API access',
                            'Dedicated account manager',
                            'Priority feature requests'
                        ]
                    ]
                ];
                
                $response['success'] = true;
                $response['plans'] = $plans;
                break;
                
            case 'create_order':
                $plan_type = $conn->real_escape_string($data['plan_type']);
                
                // Validate plan type
                $valid_plans = ['monthly', 'quarterly', 'annual'];
                if (!in_array($plan_type, $valid_plans)) {
                    $response['message'] = 'Invalid plan type';
                    break;
                }
                
                // Get plan price
                $price = 0;
                switch ($plan_type) {
                    case 'monthly': $price = MONTHLY_PRICE; break;
                    case 'quarterly': $price = QUARTERLY_PRICE; break;
                    case 'annual': $price = ANNUAL_PRICE; break;
                }
                
                // Generate order ID
                $order_id = 'ORD' . date('Ymd') . strtoupper(uniqid());
                
                // Create order in database
                $order_sql = "INSERT INTO subscriptions (user_id, plan_type, amount, payment_status, start_date, end_date) 
                              VALUES ($user_id, '$plan_type', $price, 'pending', CURDATE(), 
                              DATE_ADD(CURDATE(), INTERVAL 1 " . ($plan_type === 'monthly' ? 'MONTH' : ($plan_type === 'quarterly' ? 'QUARTER' : 'YEAR')) . "))";
                
                if ($conn->query($order_sql)) {
                    $order_db_id = $conn->insert_id;
                    
                    // Here you would integrate with payment gateway (Razorpay/Stripe)
                    // For now, return mock payment data
                    $response['success'] = true;
                    $response['order'] = [
                        'id' => $order_id,
                        'db_id' => $order_db_id,
                        'amount' => $price,
                        'currency' => 'INR',
                        'plan_type' => $plan_type
                    ];
                    $response['payment_data'] = [
                        'key' => 'rzp_test_YOUR_KEY', // Replace with actual key
                        'amount' => $price * 100, // In paise
                        'currency' => 'INR',
                        'order_id' => $order_id,
                        'name' => 'IncomePlus Scanner',
                        'description' => ucfirst($plan_type) . ' Subscription',
                        'prefill' => [
                            'name' => $_SESSION['user_name'] ?? '',
                            'email' => $_SESSION['user_email'] ?? ''
                        ],
                        'theme' => [
                            'color' => '#4f46e5'
                        ]
                    ];
                } else {
                    $response['message'] = 'Failed to create order';
                }
                break;
                
            case 'verify_payment':
                $payment_id = $conn->real_escape_string($data['payment_id']);
                $order_id = $conn->real_escape_string($data['order_id']);
                $signature = $conn->real_escape_string($data['signature']);
                
                // Verify payment with payment gateway
                // For now, simulate successful verification
                
                // Update subscription
                $update_order_sql = "UPDATE subscriptions SET 
                                    payment_id = '$payment_id',
                                    payment_status = 'completed',
                                    payment_gateway = 'razorpay',
                                    updated_at = NOW()
                                    WHERE id = " . intval($data['order_db_id']);
                
                if ($conn->query($update_order_sql)) {
                    // Update user subscription
                    $order_sql = "SELECT * FROM subscriptions WHERE id = " . intval($data['order_db_id']);
                    $order_result = $conn->query($order_sql);
                    $order = $order_result->fetch_assoc();
                    
                    $update_user_sql = "UPDATE users SET 
                                       subscription_type = '{$order['plan_type']}',
                                       subscription_start = '{$order['start_date']}',
                                       subscription_end = '{$order['end_date']}',
                                       status = 'active'
                                       WHERE id = $user_id";
                    
                    if ($conn->query($update_user_sql)) {
                        // Log audit
                        $audit_sql = "INSERT INTO audit_logs (user_id, action_type, action_details) 
                                      VALUES ($user_id, 'subscription_payment', '{$order['plan_type']} subscription activated')";
                        $conn->query($audit_sql);
                        
                        $response['success'] = true;
                        $response['message'] = 'Payment verified and subscription activated';
                    } else {
                        $response['message'] = 'Failed to update user subscription';
                    }
                } else {
                    $response['message'] = 'Failed to update payment status';
                }
                break;
                
            case 'cancel_subscription':
                // Update subscription end date to today
                $cancel_sql = "UPDATE users SET status = 'expired' WHERE id = $user_id";
                
                if ($conn->query($cancel_sql)) {
                    // Log audit
                    $audit_sql = "INSERT INTO audit_logs (user_id, action_type) 
                                  VALUES ($user_id, 'subscription_cancelled')";
                    $conn->query($audit_sql);
                    
                    $response['success'] = true;
                    $response['message'] = 'Subscription cancelled successfully';
                } else {
                    $response['message'] = 'Failed to cancel subscription';
                }
                break;
        }
    }
}

echo json_encode($response);
$conn->close();
?>
