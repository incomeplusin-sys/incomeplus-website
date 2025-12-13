<?php
header('Content-Type: application/json');
require_once '../config.php';

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
                        // Check subscription
                        if ($user['subscription_end'] < date('Y-m-d')) {
                            echo json_encode(['success' => false, 'message' => 'Subscription expired']);
                        } else {
                            // Update last login
                            $update_sql = "UPDATE users SET last_login = NOW() WHERE id = {$user['id']}";
                            $conn->query($update_sql);
                            
                            // Create session
                            $_SESSION['user_id'] = $user['id'];
                            $_SESSION['email'] = $user['email'];
                            
                            echo json_encode(['success' => true, 'user' => $user]);
                        }
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
                    }
                } else {
                    echo json_encode(['success' => false, 'message' => 'User not found']);
                }
                break;
                
            case 'register':
                // Registration logic
                break;
                
            case 'logout':
                session_destroy();
                echo json_encode(['success' => true]);
                break;
        }
    }
}
?>
