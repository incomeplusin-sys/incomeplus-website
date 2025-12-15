<?php
header('Content-Type: application/json');
require_once 'config.php';

session_start();

$response = ['success' => false, 'message' => ''];

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
            case 'run_volume_scan':
                $params = $data['params'];
                
                // Execute Python scanner
                $python_script = escapeshellcmd(__DIR__ . '/../../scanner.py');
                $params_json = escapeshellarg(json_encode($params));
                
                $command = "python3 {$python_script} --params {$params_json}";
                $output = shell_exec($command);
                
                if ($output) {
                    $results = json_decode($output, true);
                    
                    // Save to database
                    foreach ($results['results'] as $result) {
                        $sql = "INSERT INTO scan_results (
                            user_id, scanner_type, stock_symbol, signal_type, confidence,
                            parameters, result_data, scan_time
                        ) VALUES (?, 'volume_pattern', ?, ?, ?, ?, ?, NOW())";
                        
                        $stmt = $conn->prepare($sql);
                        $stmt->bind_param("issdss", 
                            $user_id,
                            $result['symbol'],
                            $result['pattern'],
                            $result['confidence'],
                            json_encode($params),
                            json_encode($result)
                        );
                        $stmt->execute();
                        $stmt->close();
                    }
                    
                    $response['success'] = true;
                    $response['results'] = $results['results'];
                    $response['summary'] = $results['summary'];
                    $response['message'] = 'Scan completed successfully';
                    
                } else {
                    $response['message'] = 'Scanner failed to execute';
                }
                break;
                
            case 'save_results':
                $results = $data['results'];
                
                foreach ($results as $result) {
                    $sql = "INSERT INTO scan_results (
                        user_id, scanner_type, stock_symbol, signal_type, confidence,
                        price, price_change, volume, scan_time, result_data
                    ) VALUES (?, 'volume_pattern', ?, ?, ?, ?, ?, ?, ?, ?)";
                    
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("issdddiss", 
                        $user_id,
                        $result['symbol'],
                        $result['pattern'],
                        $result['confidence'],
                        $result['price'],
                        $result['change'],
                        $result['volume'],
                        $result['time'],
                        json_encode($result)
                    );
                    $stmt->execute();
                    $stmt->close();
                }
                
                $response['success'] = true;
                $response['message'] = 'Results saved successfully';
                break;
                
            case 'get_recent_scans':
                $limit = intval($data['limit'] ?? 10);
                
                $sql = "SELECT * FROM scan_results 
                        WHERE user_id = ? 
                        ORDER BY scan_time DESC 
                        LIMIT ?";
                
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ii", $user_id, $limit);
                $stmt->execute();
                $result = $stmt->get_result();
                
                $scans = [];
                while ($row = $result->fetch_assoc()) {
                    $scans[] = $row;
                }
                
                $response['success'] = true;
                $response['scans'] = $scans;
                break;
        }
    }
}

echo json_encode($response);
$conn->close();
?>
