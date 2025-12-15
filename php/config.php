<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'incomeplus_scanner');

// Site Configuration
define('SITE_URL', 'http://localhost/incomeplus_scanner');
define('SITE_NAME', 'IncomePlus Scanner');
define('ADMIN_EMAIL', 'support@incomeplus.in');

// Subscription Configuration
define('TRIAL_DAYS', 7);
define('MONTHLY_PRICE', 999);
define('QUARTERLY_PRICE', 2699);
define('ANNUAL_PRICE', 9999);

// Scanner Configuration
define('MAX_DAILY_SCANS_TRIAL', 50);
define('MAX_DAILY_SCANS_PAID', 1000);
define('SCAN_TIMEOUT', 300); // 5 minutes

// API Keys (Add your actual keys here)
define('RAZORPAY_KEY_ID', 'your_razorpay_key_id');
define('RAZORPAY_KEY_SECRET', 'your_razorpay_key_secret');
define('SENDGRID_API_KEY', 'your_sendgrid_key');
define('TWILIO_SID', 'your_twilio_sid');
define('TWILIO_TOKEN', 'your_twilio_token');

// Start session
session_start();

// Create database connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set timezone
date_default_timezone_set('Asia/Kolkata');

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Security headers
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('X-XSS-Protection: 1; mode=block');

// CORS headers for API
header('Access-Control-Allow-Origin: ' . SITE_URL);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Global functions
function sanitize_input($data) {
    global $conn;
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $conn->real_escape_string($data);
}

function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function generate_token($length = 32) {
    return bin2hex(random_bytes($length));
}

function log_activity($user_id, $action, $details = '') {
    global $conn;
    
    $ip_address = $_SERVER['REMOTE_ADDR'];
    $user_agent = $_SERVER['HTTP_USER_AGENT'];
    
    $sql = "INSERT INTO activity_logs (user_id, action_type, action_details, ip_address, user_agent) 
            VALUES (?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("issss", $user_id, $action, $details, $ip_address, $user_agent);
    $stmt->execute();
    $stmt->close();
}

function send_email($to, $subject, $message, $headers = []) {
    // Implementation for sending email
    // Use SendGrid, PHPMailer, or mail() function
    $default_headers = [
        'From' => ADMIN_EMAIL,
        'Reply-To' => ADMIN_EMAIL,
        'X-Mailer' => 'PHP/' . phpversion(),
        'MIME-Version' => '1.0',
        'Content-Type' => 'text/html; charset=UTF-8'
    ];
    
    $headers = array_merge($default_headers, $headers);
    
    $header_string = '';
    foreach ($headers as $key => $value) {
        $header_string .= "$key: $value\r\n";
    }
    
    return mail($to, $subject, $message, $header_string);
}

function is_valid_subscription($user_id) {
    global $conn;
    
    $sql = "SELECT subscription_end, status FROM users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();
    
    if (!$user) return false;
    
    $today = date('Y-m-d');
    $subscription_end = $user['subscription_end'];
    $status = $user['status'];
    
    return ($status === 'active' && $subscription_end >= $today);
}

function check_scan_limit($user_id) {
    global $conn;
    
    $today = date('Y-m-d');
    
    // Get user's subscription type
    $sql = "SELECT subscription_type FROM users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();
    
    $daily_limit = ($user['subscription_type'] === 'trial') ? 
        MAX_DAILY_SCANS_TRIAL : MAX_DAILY_SCANS_PAID;
    
    // Count today's scans
    $sql = "SELECT COUNT(*) as scan_count FROM scan_results 
            WHERE user_id = ? AND DATE(scan_time) = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("is", $user_id, $today);
    $stmt->execute();
    $result = $stmt->get_result();
    $scan_data = $result->fetch_assoc();
    $stmt->close();
    
    return [
        'used' => $scan_data['scan_count'],
        'limit' => $daily_limit,
        'remaining' => $daily_limit - $scan_data['scan_count']
    ];
}

// Authentication middleware
function require_auth() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authentication required']);
        exit();
    }
}

// Admin middleware
function require_admin() {
    require_auth();
    
    global $conn;
    
    $user_id = $_SESSION['user_id'];
    $sql = "SELECT is_admin FROM users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();
    
    if (!$user || !$user['is_admin']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
}
?>
