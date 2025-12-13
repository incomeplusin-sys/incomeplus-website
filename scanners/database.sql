-- Users Table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    subscription_id INT,
    subscription_start DATE,
    subscription_end DATE,
    trial_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    status ENUM('active', 'suspended', 'expired') DEFAULT 'active'
);

-- Subscriptions Table
CREATE TABLE subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    plan_type ENUM('trial', 'monthly', 'quarterly', 'annual'),
    amount DECIMAL(10,2),
    payment_id VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status ENUM('active', 'expired', 'cancelled'),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Scan Results Table
CREATE TABLE scan_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    scanner_type VARCHAR(50),
    stock_symbol VARCHAR(20),
    signal_type VARCHAR(50),
    confidence DECIMAL(5,2),
    parameters JSON,
    result_data JSON,
    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Scanner Presets Table
CREATE TABLE scanner_presets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    scanner_type VARCHAR(50),
    preset_name VARCHAR(100),
    parameters JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Watchlists Table
CREATE TABLE watchlists (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    name VARCHAR(100),
    stocks JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
