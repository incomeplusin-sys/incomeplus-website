<?php
header('Content-Type: application/json');
require_once '../config.php';

$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['action'])) {
        switch ($data['action']) {
            case 'login':
                $email = $conn->real_escape_string($data['email']);
                $password = $data['password'];
                
                $sql = "SELECT * FROM users WHERE email = '$email'";
                $result = $conn->query($sql);
                
                if ($result->num_rows > 0) {
                    $user = $result->fetch_assoc();
                    
                    if (password_verify($password, $user['password_hash'])) {
                        // Check subscription status
                        $today = date('Y-m-d');
                        if ($user['subscription_end'] < $today && $user['status'] !== 'active') {
                            $response['message'] = 'Subscription expired. Please renew.';
                        } else {
                            // Update last login
                            $update_sql = "UPDATE users SET last_login = NOW(), last_active = NOW() WHERE id = {$user['id']}";
                            $conn->query($update_sql);
                            
                            // Create session
                            $_SESSION['user_id'] = $user['id'];
                            $_SESSION['user_email'] = $user['email'];
                            $_SESSION['user_name'] = $user['full_name'];
                            
                            // Remove password hash from response
                            unset($user['password_hash']);
                            
                            $response['success'] = true;
                            $response['user'] = $user;
                            $response['message'] = 'Login successful';
                        }
                    } else {
                        $response['message'] = 'Invalid email or password';
                    }
                } else {
                    $response['message'] = 'User not found';
                }
                break;
                
            case 'register':
                $email = $conn->real_escape_string($data['email']);
                $password = password_hash($data['password'], PASSWORD_DEFAULT);
                $full_name = $conn->real_escape_string($data['name']);
                $phone = $conn->real_escape_string($data['phone'] ?? '');
                $company = $conn->real_escape_string($data['company'] ?? '');
                $experience = $conn->real_escape_string($data['experience'] ?? 'beginner');
                
                // Check if email exists
                $check_sql = "SELECT id FROM users WHERE email = '$email'";
                $check_result = $conn->query($check_sql);
                
                if ($check_result->num_rows > 0) {
                    $response['message'] = 'Email already registered';
                } else {
                    // Calculate trial end date (7 days from now)
                    $trial_end = date('Y-m-d', strtotime('+7 days'));
                    
                    $insert_sql = "INSERT INTO users (email, password_hash, full_name, phone, company, experience_level, 
                                    subscription_type, subscription_start, subscription_end, trial_used, status) 
                                   VALUES ('$email', '$password', '$full_name', '$phone', '$company', '$experience',
                                           'trial', CURDATE(), '$trial_end', 1, 'active')";
                    
                    if ($conn->query($insert_sql)) {
                        $user_id = $conn->insert_id;
                        
                        // Create subscription record
                        $sub_sql = "INSERT INTO subscriptions (user_id, plan_type, start_date, end_date, payment_status) 
                                    VALUES ($user_id, 'trial', CURDATE(), '$trial_end', 'completed')";
                        $conn->query($sub_sql);
                        
                        // Log audit
                        $audit_sql = "INSERT INTO audit_logs (user_id, action_type, ip_address, user_agent) 
                                      VALUES ($user_id, 'registration', '{$_SERVER['REMOTE_ADDR']}', '{$_SERVER['HTTP_USER_AGENT']}')";
                        $conn->query($audit_sql);
                        
                        // Get user data
                        $user_sql = "SELECT * FROM users WHERE id = $user_id";
                        $user_result = $conn->query($user_sql);
                        $user = $user_result->fetch_assoc();
                        unset($user['password_hash']);
                        
                        $_SESSION['user_id'] = $user_id;
                        $_SESSION['user_email'] = $email;
                        $_SESSION['user_name'] = $full_name;
                        
                        $response['success'] = true;
                        $response['user'] = $user;
                        $response['message'] = 'Registration successful';
                    } else {
                        $response['message'] = 'Registration failed: ' . $conn->error;
                    }
                }
                break;
                
            case 'logout':
                session_destroy();
                $response['success'] = true;
                $response['message'] = 'Logged out successfully';
                break;
                
            case 'check_session':
                if (isset($_SESSION['user_id'])) {
                    $user_id = $_SESSION['user_id'];
                    $sql = "SELECT * FROM users WHERE id = $user_id";
                    $result = $conn->query($sql);
                    
                    if ($result->num_rows > 0) {
                        $user = $result->fetch_assoc();
                        unset($user['password_hash']);
                        
                        // Update last active
                        $update_sql = "UPDATE users SET last_active = NOW() WHERE id = $user_id";
                        $conn->query($update_sql);
                        
                        $response['success'] = true;
                        $response['user'] = $user;
                    } else {
                        session_destroy();
                        $response['message'] = 'Session expired';
                    }
                } else {
                    $response['message'] = 'No active session';
                }
                break;
        }
    }
}

echo json_encode($response);
$conn->close();
?>
