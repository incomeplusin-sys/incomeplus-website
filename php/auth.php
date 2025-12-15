<?php
session_start();

// Check if user is logged in
function is_logged_in() {
    return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
}

// Redirect to login if not authenticated
function require_auth() {
    if (!is_logged_in()) {
        header('Location: index.html');
        exit();
    }
}

// Logout function
function logout() {
    session_destroy();
    setcookie('user_token', '', time() - 3600, '/');
    header('Location: index.html');
    exit();
}
?>

<?php
header('Content-Type: application/json');
require_once 'config.php';

$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['action'])) {
        switch ($data['action']) {
            case 'login':
                handle_login($data);
                break;
                
            case 'register':
                handle_registration($data);
                break;
                
            case 'logout':
                handle_logout();
                break;
                
            case 'check_session':
                handle_session_check();
                break;
                
            case 'forgot_password':
                handle_forgot_password($data);
                break;
                
            case 'reset_password':
                handle_reset_password($data);
                break;
                
            case 'update_profile':
                handle_profile_update($data);
                break;
                
            case 'change_password':
                handle_password_change($data);
                break;
                
            default:
                $response['message'] = 'Invalid action';
        }
    }
}

echo json_encode($response);
$conn->close();

// Handler functions
function handle_login($data) {
    global $conn, $response;
    
    $email = sanitize_input($data['email']);
    $password = $data['password'];
    
    if (!validate_email($email)) {
        $response['message'] = 'Invalid email format';
        return;
    }
    
    $sql = "SELECT * FROM users WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $response['message'] = 'Invalid email or password';
        $stmt->close();
        return;
    }
    
    $user = $result->fetch_assoc();
    $stmt->close();
    
    if (!password_verify($password, $user['password_hash'])) {
        $response['message'] = 'Invalid email or password';
        return;
    }
    
    // Check subscription status
    if (!is_valid_subscription($user['id'])) {
        $response['message'] = 'Subscription expired. Please renew your subscription.';
        return;
    }
    
    // Update last login
    $update_sql = "UPDATE users SET last_login = NOW() WHERE id = ?";
    $update_stmt = $conn->prepare($update_sql);
    $update_stmt->bind_param("i", $user['id']);
    $update_stmt->execute();
    $update_stmt->close();
    
    // Set session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_name'] = $user['full_name'];
    $_SESSION['user_role'] = $user['is_admin'] ? 'admin' : 'user';
    
    // Log activity
    log_activity($user['id'], 'login');
    
    // Remove sensitive data
    unset($user['password_hash']);
    unset($user['reset_token']);
    unset($user['reset_token_expiry']);
    
    $response['success'] = true;
    $response['user'] = $user;
    $response['message'] = 'Login successful';
}

function handle_registration($data) {
    global $conn, $response;
    
    $email = sanitize_input($data['email']);
    $password = $data['password'];
    $full_name = sanitize_input($data['name']);
    $phone = sanitize_input($data['phone'] ?? '');
    $company = sanitize_input($data['company'] ?? '');
    $experience = sanitize_input($data['experience'] ?? 'beginner');
    
    if (!validate_email($email)) {
        $response['message'] = 'Invalid email format';
        return;
    }
    
    if (strlen($password) < 8) {
        $response['message'] = 'Password must be at least 8 characters';
        return;
    }
    
    // Check if email exists
    $check_sql = "SELECT id FROM users WHERE email = ?";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("s", $email);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows > 0) {
        $response['message'] = 'Email already registered';
        $check_stmt->close();
        return;
    }
    $check_stmt->close();
    
    // Hash password
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Calculate trial dates
    $trial_start = date('Y-m-d');
    $trial_end = date('Y-m-d', strtotime("+" . TRIAL_DAYS . " days"));
    
    // Insert user
    $insert_sql = "INSERT INTO users (email, password_hash, full_name, phone, company, 
                    experience_level, subscription_type, subscription_start, subscription_end, 
                    trial_used, status) 
                   VALUES (?, ?, ?, ?, ?, ?, 'trial', ?, ?, 1, 'active')";
    
    $insert_stmt = $conn->prepare($insert_sql);
    $insert_stmt->bind_param("ssssssss", $email, $password_hash, $full_name, $phone, 
                            $company, $experience, $trial_start, $trial_end);
    
    if (!$insert_stmt->execute()) {
        $response['message'] = 'Registration failed: ' . $conn->error;
        $insert_stmt->close();
        return;
    }
    
    $user_id = $conn->insert_id;
    $insert_stmt->close();
    
    // Create subscription record
    $sub_sql = "INSERT INTO subscriptions (user_id, plan_type, amount, start_date, end_date, status) 
                VALUES (?, 'trial', 0, ?, ?, 'active')";
    $sub_stmt = $conn->prepare($sub_sql);
    $sub_stmt->bind_param("iss", $user_id, $trial_start, $trial_end);
    $sub_stmt->execute();
    $sub_stmt->close();
    
    // Create default watchlist
    $watchlist_sql = "INSERT INTO watchlists (user_id, name, stocks) VALUES (?, 'My Watchlist', '[]')";
    $watchlist_stmt = $conn->prepare($watchlist_sql);
    $watchlist_stmt->bind_param("i", $user_id);
    $watchlist_stmt->execute();
    $watchlist_stmt->close();
    
    // Set session
    $_SESSION['user_id'] = $user_id;
    $_SESSION['user_email'] = $email;
    $_SESSION['user_name'] = $full_name;
    $_SESSION['user_role'] = 'user';
    
    // Get user data for response
    $user_sql = "SELECT * FROM users WHERE id = ?";
    $user_stmt = $conn->prepare($user_sql);
    $user_stmt->bind_param("i", $user_id);
    $user_stmt->execute();
    $user_result = $user_stmt->get_result();
    $user = $user_result->fetch_assoc();
    $user_stmt->close();
    
    // Remove sensitive data
    unset($user['password_hash']);
    
    // Log activity
    log_activity($user_id, 'registration');
    
    // Send welcome email
    send_welcome_email($email, $full_name, $trial_end);
    
    $response['success'] = true;
    $response['user'] = $user;
    $response['message'] = 'Registration successful. Welcome to your free trial!';
}

function handle_logout() {
    global $response;
    
    if (isset($_SESSION['user_id'])) {
        log_activity($_SESSION['user_id'], 'logout');
    }
    
    session_destroy();
    session_start();
    session_regenerate_id(true);
    
    $response['success'] = true;
    $response['message'] = 'Logged out successfully';
}

function handle_session_check() {
    global $conn, $response;
    
    if (isset($_SESSION['user_id'])) {
        $user_id = $_SESSION['user_id'];
        
        $sql = "SELECT * FROM users WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            
            // Check if subscription is still valid
            if (!is_valid_subscription($user['id'])) {
                // Update status to expired
                $update_sql = "UPDATE users SET status = 'expired' WHERE id = ?";
                $update_stmt = $conn->prepare($update_sql);
                $update_stmt->bind_param("i", $user_id);
                $update_stmt->execute();
                $update_stmt->close();
                
                $user['status'] = 'expired';
            }
            
            // Remove sensitive data
            unset($user['password_hash']);
            
            $response['success'] = true;
            $response['user'] = $user;
        } else {
            session_destroy();
            $response['message'] = 'Session expired';
        }
        
        $stmt->close();
    } else {
        $response['message'] = 'No active session';
    }
}

function handle_forgot_password($data) {
    global $conn, $response;
    
    $email = sanitize_input($data['email']);
    
    if (!validate_email($email)) {
        $response['message'] = 'Invalid email format';
        return;
    }
    
    $sql = "SELECT id, full_name FROM users WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $response['message'] = 'Email not found';
        $stmt->close();
        return;
    }
    
    $user = $result->fetch_assoc();
    $stmt->close();
    
    // Generate reset token
    $reset_token = generate_token();
    $token_expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    $update_sql = "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?";
    $update_stmt = $conn->prepare($update_sql);
    $update_stmt->bind_param("ssi", $reset_token, $token_expiry, $user['id']);
    $update_stmt->execute();
    $update_stmt->close();
    
    // Send reset email
    $reset_link = SITE_URL . "/reset-password.php?token=" . $reset_token;
    $subject = "Password Reset Request - " . SITE_NAME;
    $message = "
        <h2>Password Reset Request</h2>
        <p>Hello {$user['full_name']},</p>
        <p>You requested to reset your password. Click the link below to reset your password:</p>
        <p><a href='{$reset_link}' style='background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;'>Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
    ";
    
    if (send_email($email, $subject, $message)) {
        $response['success'] = true;
        $response['message'] = 'Password reset instructions sent to your email';
    } else {
        $response['message'] = 'Failed to send reset email';
    }
}

function handle_reset_password($data) {
    global $conn, $response;
    
    $token = sanitize_input($data['token']);
    $new_password = $data['new_password'];
    
    if (strlen($new_password) < 8) {
        $response['message'] = 'Password must be at least 8 characters';
        return;
    }
    
    // Check token validity
    $sql = "SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $response['message'] = 'Invalid or expired reset token';
        $stmt->close();
        return;
    }
    
    $user = $result->fetch_assoc();
    $stmt->close();
    
    // Update password
    $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
    
    $update_sql = "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?";
    $update_stmt = $conn->prepare($update_sql);
    $update_stmt->bind_param("si", $password_hash, $user['id']);
    
    if ($update_stmt->execute()) {
        log_activity($user['id'], 'password_reset');
        
        $response['success'] = true;
        $response['message'] = 'Password reset successful';
    } else {
        $response['message'] = 'Failed to reset password';
    }
    
    $update_stmt->close();
}

function handle_profile_update($data) {
    global $conn, $response;
    
    require_auth();
    
    $user_id = $_SESSION['user_id'];
    $full_name = sanitize_input($data['full_name'] ?? '');
    $phone = sanitize_input($data['phone'] ?? '');
    $company = sanitize_input($data['company'] ?? '');
    $experience = sanitize_input($data['experience'] ?? 'beginner');
    
    $sql = "UPDATE users SET full_name = ?, phone = ?, company = ?, experience_level = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssssi", $full_name, $phone, $company, $experience, $user_id);
    
    if ($stmt->execute()) {
        // Update session name
        $_SESSION['user_name'] = $full_name;
        
        log_activity($user_id, 'profile_update');
        
        $response['success'] = true;
        $response['message'] = 'Profile updated successfully';
    } else {
        $response['message'] = 'Failed to update profile';
    }
    
    $stmt->close();
}

function handle_password_change($data) {
    global $conn, $response;
    
    require_auth();
    
    $user_id = $_SESSION['user_id'];
    $current_password = $data['current_password'];
    $new_password = $data['new_password'];
    
    if (strlen($new_password) < 8) {
        $response['message'] = 'New password must be at least 8 characters';
        return;
    }
    
    // Verify current password
    $sql = "SELECT password_hash FROM users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();
    
    if (!password_verify($current_password, $user['password_hash'])) {
        $response['message'] = 'Current password is incorrect';
        return;
    }
    
    // Update password
    $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
    
    $update_sql = "UPDATE users SET password_hash = ? WHERE id = ?";
    $update_stmt = $conn->prepare($update_sql);
    $update_stmt->bind_param("si", $password_hash, $user_id);
    
    if ($update_stmt->execute()) {
        log_activity($user_id, 'password_change');
        
        $response['success'] = true;
        $response['message'] = 'Password changed successfully';
    } else {
        $response['message'] = 'Failed to change password';
    }
    
    $update_stmt->close();
}

function send_welcome_email($email, $name, $trial_end) {
    $subject = "Welcome to " . SITE_NAME . " - Start Your Free Trial";
    $trial_end_formatted = date('F j, Y', strtotime($trial_end));
    
    $message = "
        <div style='max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;'>
            <div style='background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center; color: white;'>
                <h1 style='margin: 0;'>Welcome to " . SITE_NAME . "!</h1>
            </div>
            
            <div style='padding: 30px; background: #f8fafc;'>
                <p>Hello {$name},</p>
                
                <p>Thank you for joining " . SITE_NAME . "! Your account has been created successfully.</p>
                
                <div style='background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #4f46e5;'>
                    <h3 style='margin-top: 0;'>Your Free Trial Details:</h3>
                    <ul style='margin-bottom: 0;'>
                        <li><strong>Duration:</strong> " . TRIAL_DAYS . " days</li>
                        <li><strong>Expires:</strong> {$trial_end_formatted}</li>
                        <li><strong>Daily Scans:</strong> " . MAX_DAILY_SCANS_TRIAL . " per day</li>
                        <li><strong>Access:</strong> All 10 advanced scanners</li>
                    </ul>
                </div>
                
                <p>To get started, simply log in to your dashboard and run your first scan.</p>
                
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='" . SITE_URL . "/dashboard.html' style='background: #4f46e5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;'>
                        Go to Dashboard
                    </a>
                </div>
                
                <p>Need help getting started? Check out our:</p>
                <ul>
                    <li><a href='" . SITE_URL . "/faq.html'>FAQ & Documentation</a></li>
                    <li><a href='" . SITE_URL . "/tutorials.html'>Video Tutorials</a></li>
                </ul>
                
                <p>If you have any questions, feel free to reply to this email or contact our support team.</p>
                
                <p>Happy Scanning!</p>
                <p>The " . SITE_NAME . " Team</p>
            </div>
            
            <div style='background: #2d3748; color: white; padding: 20px; text-align: center; font-size: 12px;'>
                <p>&copy; " . date('Y') . " " . SITE_NAME . ". All rights reserved.</p>
                <p>This is a technical analysis tools platform. Not investment advice.</p>
            </div>
        </div>
    ";
    
    return send_email($email, $subject, $message);
}
?>
