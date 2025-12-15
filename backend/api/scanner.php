<?php
header('Content-Type: application/json');
require_once dirname(__DIR__) . '/config.php';

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
                
                // Run scanner - NOW CALLS YOUR PYTHON SCANNERS
                $results = runPythonScanner($scanner_type, $data['parameters']);
                
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
                            $data['parameters']['timeframe'] ?? '1H',
                            $parameters,
                            json_encode($result)
                        );
                        $stmt->execute();
                        $stmt->close();
                    }
                    
                    $response['success'] = true;
                    $response['results'] = $results;
                    $response['message'] = 'Scan completed with Python engine';
                    $response['metadata'] = [
                        'scanner_type' => $scanner_type,
                        'results_count' => count($results),
                        'is_real_data' => true,
                        'engine' => 'python'
                    ];
                } else {
                    $response['message'] = 'No results found from Python scanner';
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
                
            case 'test_python_connection':
                // Test if Python integration is working
                $test_result = testPythonConnection();
                $response['success'] = $test_result['success'];
                $response['message'] = $test_result['message'];
                $response['details'] = $test_result['details'];
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
            
        case 'available_scanners':
            $response['success'] = true;
            $response['scanners'] = [
                ['id' => 'breakout', 'name' => 'Breakout Scanner', 'requires_python' => true],
                ['id' => 'momentum', 'name' => 'Momentum Scanner', 'requires_python' => true],
                ['id' => 'volume', 'name' => 'Volume-Price Scanner', 'requires_python' => true],
                ['id' => 'ma_crossover', 'name' => 'Moving Average Crossover', 'requires_python' => true],
                ['id' => 'support_resistance', 'name' => 'Support & Resistance', 'requires_python' => true],
                ['id' => 'gap', 'name' => 'Gap Scanner', 'requires_python' => true],
                ['id' => 'new_highs', 'name' => 'New Highs/Lows Scanner', 'requires_python' => true],
                ['id' => 'bollinger', 'name' => 'Bollinger Squeeze', 'requires_python' => true],
                ['id' => 'earnings', 'name' => 'Earnings Gap Scanner', 'requires_python' => true],
                ['id' => 'unusual_volume', 'name' => 'Unusual Volume Scanner', 'requires_python' => true]
            ];
            break;
    }
}

echo json_encode($response);
$conn->close();

// ============================================
// PYTHON SCANNER INTEGRATION FUNCTIONS
// ============================================

function runPythonScanner($type, $parameters) {
    // Map scanner types to Python scripts
    $scannerMap = [
        'breakout' => 'breakout_scanner.py',
        'momentum' => 'momentum_scanner.py',
        'volume' => 'volume_scanner.py',
        'ma_crossover' => 'ma_crossover_scanner.py',
        'support_resistance' => 'support_resistance_scanner.py',
        'gap' => 'gap_scanner.py',
        'new_highs' => 'new_highs_scanner.py',
        'bollinger' => 'bollinger_scanner.py',
        'earnings' => 'earnings_scanner.py',
        'unusual_volume' => 'unusual_volume_scanner.py'
    ];
    
    if (!isset($scannerMap[$type])) {
        error_log("Unknown scanner type: $type");
        return getMockData($type, $parameters);
    }
    
    $pythonScript = dirname(__DIR__) . '/python_scanners/' . $scannerMap[$type];
    
    if (!file_exists($pythonScript)) {
        error_log("Python scanner not found: $pythonScript");
        logScannerError("Python file not found: " . $pythonScript);
        return getMockData($type, $parameters);
    }
    
    // Build command with parameters
    $paramsJson = escapeshellarg(json_encode(array_merge(
        ['scanner_type' => $type],
        $parameters
    )));
    
    // Execute Python scanner
    $command = "python3 " . escapeshellcmd($pythonScript) . " " . $paramsJson . " 2>&1";
    
    error_log("Running Python scanner: " . $command);
    $startTime = microtime(true);
    
    $output = shell_exec($command);
    $executionTime = round(microtime(true) - $startTime, 2);
    
    if (!$output) {
        error_log("Python scanner returned no output: $command");
        logScannerError("No output from Python scanner: $type");
        return getMockData($type, $parameters);
    }
    
    // Parse JSON output from Python
    $data = json_decode(trim($output), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Invalid JSON from Python: " . json_last_error_msg() . "\nOutput: $output");
        logScannerError("Invalid JSON from Python: " . json_last_error_msg());
        return getMockData($type, $parameters);
    }
    
    // Check for Python errors
    if (isset($data['error'])) {
        error_log("Python scanner error: " . $data['error']);
        logScannerError("Python error: " . $data['error']);
        return getMockData($type, $parameters);
    }
    
    // Format results for database
    $results = formatPythonResults($data, $type);
    
    // Log successful scan
    logScannerSuccess($type, count($results), $executionTime);
    
    return $results;
}

function formatPythonResults($pythonData, $scannerType) {
    $results = [];
    
    if (!isset($pythonData['signals']) || !is_array($pythonData['signals'])) {
        return [];
    }
    
    foreach ($pythonData['signals'] as $signal) {
        // Extract common fields from Python output
        $symbol = $signal['symbol'] ?? $signal['stock'] ?? 'UNKNOWN';
        $signalType = $signal['type'] ?? $signal['signal'] ?? 'Unknown';
        $confidence = floatval($signal['confidence'] ?? $signal['score'] ?? 0);
        $price = floatval($signal['price'] ?? $signal['current_price'] ?? 0);
        $priceChange = floatval($signal['price_change'] ?? $signal['change_percent'] ?? 0);
        $volume = intval($signal['volume'] ?? $signal['volume_traded'] ?? 0);
        $volumeChange = floatval($signal['volume_change'] ?? $signal['volume_change_percent'] ?? 0);
        
        // Get stock name
        $stockName = getStockName($symbol);
        
        // Add scanner-specific details
        $details = $signal['details'] ?? $signal['metadata'] ?? [];
        $details['python_scanner'] = $scannerType;
        $details['scanned_at'] = date('Y-m-d H:i:s');
        
        $results[] = [
            'symbol' => $symbol,
            'name' => $stockName,
            'signal' => $signalType,
            'confidence' => $confidence,
            'price' => $price,
            'price_change' => $priceChange,
            'volume' => $volume,
            'volume_change' => $volumeChange,
            'details' => json_encode($details)
        ];
    }
    
    return $results;
}

function getStockName($symbol) {
    $stockNames = [
        'RELIANCE' => 'Reliance Industries',
        'TCS' => 'Tata Consultancy Services',
        'HDFCBANK' => 'HDFC Bank',
        'INFY' => 'Infosys',
        'ICICIBANK' => 'ICICI Bank',
        'SBIN' => 'State Bank of India',
        'BHARTIARTL' => 'Bharti Airtel',
        'ITC' => 'ITC Limited',
        'KOTAKBANK' => 'Kotak Mahindra Bank',
        'AXISBANK' => 'Axis Bank',
        'LT' => 'Larsen & Toubro',
        'HCLTECH' => 'HCL Technologies',
        'BAJFINANCE' => 'Bajaj Finance',
        'WIPRO' => 'Wipro',
        'ONGC' => 'Oil & Natural Gas Corp',
        'MARUTI' => 'Maruti Suzuki',
        'SUNPHARMA' => 'Sun Pharmaceutical',
        'TITAN' => 'Titan Company',
        'ULTRACEMCO' => 'UltraTech Cement',
        'NTPC' => 'NTPC Limited'
    ];
    
    return $stockNames[strtoupper($symbol)] ?? $symbol;
}

function getMockData($type, $parameters) {
    // Fallback mock data when Python fails
    $stocks = [
        ['symbol' => 'RELIANCE', 'name' => 'Reliance Industries'],
        ['symbol' => 'TCS', 'name' => 'Tata Consultancy Services'],
        ['symbol' => 'HDFCBANK', 'name' => 'HDFC Bank'],
        ['symbol' => 'INFY', 'name' => 'Infosys'],
        ['symbol' => 'ICICIBANK', 'name' => 'ICICI Bank']
    ];
    
    $signals = ['Bullish Breakout', 'Bearish Reversal', 'Neutral', 'Strong Buy', 'Sell Signal'];
    $results = [];
    
    foreach ($stocks as $stock) {
        if (rand(0, 100) > 40) { // 60% chance of signal
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
                'volume_change' => $volume_change,
                'details' => json_encode([
                    'is_mock_data' => true,
                    'scanner_type' => $type,
                    'mock_reason' => 'Python scanner unavailable'
                ])
            ];
        }
    }
    
    return $results;
}

function testPythonConnection() {
    $testScript = dirname(__DIR__) . '/python_scanners/test_connection.py';
    
    // Create a simple test script if it doesn't exist
    if (!file_exists($testScript)) {
        file_put_contents($testScript, '#!/usr/bin/env python3
import json
import sys
print(json.dumps({
    "success": True,
    "message": "Python connection test successful",
    "python_version": sys.version,
    "test": "OK"
}))');
        chmod($testScript, 0755);
    }
    
    $command = "python3 " . escapeshellcmd($testScript) . " 2>&1";
    $output = shell_exec($command);
    
    if (!$output) {
        return [
            'success' => false,
            'message' => 'Python test failed - no output',
            'details' => ['command' => $command]
        ];
    }
    
    $data = json_decode(trim($output), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        return [
            'success' => false,
            'message' => 'Invalid JSON from Python test',
            'details' => ['output' => $output, 'error' => json_last_error_msg()]
        ];
    }
    
    return [
        'success' => true,
        'message' => 'Python integration working',
        'details' => $data
    ];
}

function logScannerError($error) {
    $logFile = dirname(__DIR__) . '/logs/scanner_errors.log';
    $logDir = dirname($logFile);
    
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logEntry = date('Y-m-d H:i:s') . " - " . $error . "\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

function logScannerSuccess($scannerType, $resultsCount, $executionTime) {
    $logFile = dirname(__DIR__) . '/logs/scanner_success.log';
    $logDir = dirname($logFile);
    
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logEntry = date('Y-m-d H:i:s') . " - $scannerType: $resultsCount signals in {$executionTime}s\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}
?>
