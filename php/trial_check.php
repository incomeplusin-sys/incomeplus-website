<?php
session_start();

function check_trial_status($username) {
    // In production, fetch from database
    $trial_users = [
        'admin' => [
            'start_date' => '2024-01-01',
            'end_date' => '2024-02-01',
            'used' => true
        ]
    ];
    
    if (isset($trial_users[$username])) {
        $user = $trial_users[$username];
        
        // Check if trial has ended
        $today = date('Y-m-d');
        if ($today > $user['end_date'] || $user['used']) {
            return false; // Trial expired or used
        }
        return true; // Trial still valid
    }
    
    return false; // User not found
}

// Usage in dashboard
if (isset($_SESSION['user'])) {
    if (!check_trial_status($_SESSION['user'])) {
        // Redirect to subscription page
        header('Location: subscription.html?message=trial_expired');
        exit();
    }
}
?>
