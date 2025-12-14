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
            case 'run_scan':
                $scanner_type = $conn->real_escape_string($data['scanner_type']);
                $parameters = json_encode($data['parameters']);
                
                // Check user's scan limit
                $today = date('Y-m-d');
                $scan_count_sql = "SELECT COUNT(*) as count FROM scan_results WHERE user_id = $user_id AND DATE(scan_date) = '$today'";
                $scan_count_result = $conn->query($scan_count_sql);
                $scan_count = $scan_count_result->fetch_assoc()['count'];
                
                // Get user's plan
                $user_sql = "SELECT subscription_type FROM users WHERE id = $user_id";
                $user_result = $conn->query($user_sql);
                $user = $user_result->fetch_assoc();
                
                $daily_limit = 1000; // Default for paid plans
                if ($user['subscription_type'] === 'trial') {
                    $daily_limit = 50;
                }
                
                if ($scan_count >= $daily_limit) {
                    $response['message'] = 'Daily scan limit reached. Upgrade plan for more scans.';
                    break;
                }
                
                // Run scanner (this is where you'd integrate with your scanner engine)
                $results = runScanner($scanner_type, $data['parameters']);
                
                if ($results) {
                    // Save results to database
                    foreach ($results as $result) {
                        $save_sql = "INSERT INTO scan_results (user_id, scanner_type, stock_symbol, stock_name, signal_type, 
                                    confidence_score, price, price_change, volume, volume_change, timeframe, 
                                    scan_date, scan_time, parameters, result_data) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), CURTIME(), ?, ?)";
                        
                        $stmt = $conn->prepare($save_sql);
                        $stmt->bind_param("issssddddssss",
                            $user_id,
                            $scanner_type,
                            $result['symbol'],
                            $result['name'],
                            $result['signal'],
                            $result['confidence'],
                            $result['price'],
                            $result['price_change'],
                            $result['volume'],
                            $result['volume_change'],
                            $data['parameters']['timeframe'],
                            $parameters,
                            json_encode($result)
                        );
                        $stmt->execute();
                        $stmt->close();
                    }
                    
                    $response['success'] = true;
                    $response['results'] = $results;
                    $response['message'] = 'Scan completed successfully';
                } else {
                    $response['message'] = 'No results found';
                }
                break;
                
            case 'save_preset':
                $scanner_type = $conn->real_escape_string($data['scanner_type']);
                $preset_name = $conn->real_escape_string($data['preset_name']);
                $parameters = json_encode($data['parameters']);
                
                $sql = "INSERT INTO scanner_presets (user_id, scanner_type, preset_name, parameters) 
                        VALUES ($user_id, '$scanner_type', '$preset_name', '$parameters')
                        ON DUPLICATE KEY UPDATE parameters = VALUES(parameters), updated_at = NOW()";
                
                if ($conn->query($sql)) {
                    $response['success'] = true;
                    $response['message'] = 'Preset saved successfully';
                } else {
                    $response['message'] = 'Failed to save preset';
                }
                break;
                
            case 'get_presets':
                $scanner_type = $conn->real_escape_string($data['scanner_type']);
                
                $sql = "SELECT * FROM scanner_presets WHERE user_id = $user_id AND scanner_type = '$scanner_type' ORDER BY is_default DESC, preset_name ASC";
                $result = $conn->query($sql);
                
                $presets = [];
                while ($row = $result->fetch_assoc()) {
                    $presets[] = $row;
                }
                
                $response['success'] = true;
                $response['presets'] = $presets;
                break;
                
            case 'get_recent_results':
                $limit = intval($data['limit'] ?? 10);
                $scanner_type = $data['scanner_type'] ?? null;
                
                $sql = "SELECT sr.*, ns.name as stock_name_full 
                        FROM scan_results sr 
                        LEFT JOIN nifty_stocks ns ON sr.stock_symbol = ns.symbol 
                        WHERE sr.user_id = $user_id";
                
                if ($scanner_type) {
                    $sql .= " AND sr.scanner_type = '" . $conn->real_escape_string($scanner_type) . "'";
                }
                
                $sql .= " ORDER BY sr.scan_date DESC, sr.scan_time DESC LIMIT $limit";
                
                $result = $conn->query($sql);
                
                $results = [];
                while ($row = $result->fetch_assoc()) {
                    $results[] = $row;
                }
                
                $response['success'] = true;
                $response['results'] = $results;
                break;
        }
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'dashboard_stats':
            $today = date('Y-m-d');
            
            // Today's scans
            $scan_sql = "SELECT COUNT(*) as count FROM scan_results WHERE user_id = $user_id AND DATE(scan_date) = '$today'";
            $scan_result = $conn->query($scan_sql);
            $today_scans = $scan_result->fetch_assoc()['count'];
            
            // Active alerts
            $alert_sql = "SELECT COUNT(*) as count FROM alerts WHERE user_id = $user_id AND status = 'pending'";
            $alert_result = $conn->query($alert_sql);
            $active_alerts = $alert_result->fetch_assoc()['count'];
            
            // Accuracy rate (last 30 days)
            $accuracy_sql = "SELECT AVG(confidence_score) as accuracy FROM scan_results 
                            WHERE user_id = $user_id AND scan_date >= DATE_SUB('$today', INTERVAL 30 DAY)";
            $accuracy_result = $conn->query($accuracy_sql);
            $accuracy = $accuracy_result->fetch_assoc()['accuracy'] ?? 0;
            
            // Scans used (this month)
            $month_start = date('Y-m-01');
            $scans_sql = "SELECT COUNT(*) as count FROM scan_results WHERE user_id = $user_id AND scan_date >= '$month_start'";
            $scans_result = $conn->query($scans_sql);
            $scans_used = $scans_result->fetch_assoc()['count'];
            
            $response['success'] = true;
            $response['stats'] = [
                'todayScans' => $today_scans,
                'activeAlerts' => $active_alerts,
                'accuracyRate' => round($accuracy, 1),
                'scansUsed' => $scans_used
            ];
            break;
    }
}

echo json_encode($response);
$conn->close();

// Scanner engine function (simplified)
function runScanner($type, $parameters) {
    // This is where you'd implement your actual scanner logic
    // For now, return mock data
    
    $stocks = [
        ['symbol' => 'RELIANCE', 'name' => 'Reliance Industries'],
        ['symbol' => 'TCS', 'name' => 'Tata Consultancy Services'],
        ['symbol' => 'HDFCBANK', 'name' => 'HDFC Bank'],
        ['symbol' => 'INFY', 'name' => 'Infosys'],
        ['symbol' => 'ICICIBANK', 'name' => 'ICICI Bank']
    ];
    
    $signals = ['Bullish', 'Bearish', 'Neutral'];
    $results = [];
    
    foreach ($stocks as $stock) {
        if (rand(0, 100) > 50) { // 50% chance of signal
            $signal = $signals[array_rand($signals)];
            $confidence = rand(65, 95);
            $price = rand(1000, 5000) + (rand(0, 99) / 100);
            $price_change = rand(-5, 5) + (rand(0, 99) / 100);
            $volume = rand(100000, 10000000);
            $volume_change = rand(-20, 20) + (rand(0, 99) / 100);
            
            $results[] = [
                'symbol' => $stock['symbol'],
                'name' => $stock['name'],
                'signal' => $signal,
                'confidence' => $confidence,
                'price' => $price,
                'price_change' => $price_change,
                'volume' => $volume,
                'volume_change' => $volume_change
            ];
        }
    }
    
    return $results;
}
?>
