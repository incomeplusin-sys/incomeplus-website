<?php
session_start();

// Simple user validation (replace with database in production)
$valid_users = [
    'admin' => 'password123',
    'user' => 'test123'
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (isset($valid_users[$username]) && $valid_users[$username] === $password) {
        $_SESSION['user'] = $username;
        $_SESSION['logged_in'] = true;
        $_SESSION['login_time'] = time();
        
        // Set cookie for 30 days if "Remember me" is checked
        if (isset($_POST['remember'])) {
            setcookie('user_token', md5($username . 'secret_key'), time() + (30 * 24 * 60 * 60), '/');
        }
        
        header('Location: dashboard.html');
        exit();
    } else {
        header('Location: index.html?error=invalid_credentials');
        exit();
    }
}
?>
