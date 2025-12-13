<?php
// Simple PHP test
echo "<!DOCTYPE html>";
echo "<html>";
echo "<head><title>PHP Test - IncomePlus</title>";
echo "<style>";
echo "body { font-family: Arial; padding: 20px; }";
echo ".success { color: green; padding: 10px; background: #d1fae5; }";
echo ".error { color: red; padding: 10px; background: #fee2e2; }";
echo "</style>";
echo "</head>";
echo "<body>";

echo "<h1>IncomePlus PHP Test</h1>";

// Test PHP version
echo "<h2>PHP Version: " . phpversion() . "</h2>";

// Test database connection
echo "<h3>Database Connection Test:</h3>";
try {
    $conn = new mysqli('localhost', 'root', '', 'incomeplus_test');
    
    if ($conn->connect_error) {
        echo "<div class='error'>MySQL Connection Failed: " . $conn->connect_error . "</div>";
        echo "<p>Try: <code>CREATE DATABASE incomeplus_test;</code></p>";
    } else {
        echo "<div class='success'>MySQL Connection Successful!</div>";
        $conn->close();
    }
} catch (Exception $e) {
    echo "<div class='error'>Error: " . $e->getMessage() . "</div>";
}

// Test file permissions
echo "<h3>File Permissions:</h3>";
$writable = is_writable('.');
echo "Current directory writable: " . ($writable ? "✅ Yes" : "❌ No");

echo "<hr>";
echo "<p><a href='index.html'>← Back to Test Home</a></p>";
echo "</body>";
echo "</html>";
?>
