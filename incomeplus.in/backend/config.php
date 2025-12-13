<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'incomeplus_scanner');

// Site Configuration
define('SITE_URL', 'http://localhost/incomeplus');
define('SITE_NAME', 'IncomePlus Scanner');
define('CURRENCY', '₹');

// Subscription Configuration
define('TRIAL_DAYS', 7);
define('MONTHLY_PRICE', 999);
define('QUARTERLY_PRICE', 2699);
define('ANNUAL_PRICE', 9999);

// API Keys (Add your actual keys)
define('YAHOO_API_URL', 'https://query1.finance.yahoo.com/v8/finance/chart/');
define('ALPHA_VANTAGE_KEY', 'YOUR_KEY_HERE');

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
?>
