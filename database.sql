-- Run this in your MySQL database
CREATE DATABASE volume_scanner;
USE volume_scanner;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    subscription_type ENUM('trial', 'monthly', 'annual') DEFAULT 'trial',
    subscription_start DATE,
    subscription_end DATE,
    trial_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    status ENUM('active', 'suspended', 'expired') DEFAULT 'active'
);

-- Scan results
CREATE TABLE scan_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    scanner_type VARCHAR(50),
    stock_symbol VARCHAR(20),
    signal_type VARCHAR(50),
    confidence DECIMAL(5,2),
    price DECIMAL(10,2),
    price_change DECIMAL(5,2),
    volume BIGINT,
    parameters JSON,
    result_data JSON,
    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Scanner presets
CREATE TABLE scanner_presets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    preset_name VARCHAR(100),
    parameters JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
