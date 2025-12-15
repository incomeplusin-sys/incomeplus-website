-- IncomePlus Scanner Database Schema

CREATE DATABASE IF NOT EXISTS incomeplus_scanner;
USE incomeplus_scanner;

-- Users Table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    company VARCHAR(255),
    experience_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    
    -- Subscription info
    subscription_type ENUM('trial', 'monthly', 'quarterly', 'annual') DEFAULT 'trial',
    subscription_start DATE,
    subscription_end DATE,
    trial_used BOOLEAN DEFAULT FALSE,
    
    -- Account status
    status ENUM('active', 'suspended', 'expired', 'cancelled') DEFAULT 'active',
    is_admin BOOLEAN DEFAULT FALSE,
    
    -- Password reset
    reset_token VARCHAR(64),
    reset_token_expiry DATETIME,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    last_active TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_subscription (subscription_type, subscription_end)
);

-- Subscriptions Table
CREATE TABLE subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_type ENUM('trial', 'monthly', 'quarterly', 'annual') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_id VARCHAR(255),
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_gateway VARCHAR(50),
    
    -- Dates
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Status
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
);

-- Scan Results Table
CREATE TABLE scan_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    -- Scanner info
    scanner_type VARCHAR(50) NOT NULL,
    stock_symbol VARCHAR(20) NOT NULL,
    stock_name VARCHAR(100),
    
    -- Signal info
    signal_type VARCHAR(50),
    confidence DECIMAL(5,2),
    price DECIMAL(10,2),
    price_change DECIMAL(5,2),
    volume BIGINT,
    volume_change DECIMAL(5,2),
    
    -- Timeframe
    timeframe VARCHAR(20),
    
    -- Parameters and results
    parameters JSON,
    result_data JSON,
    
    -- Timestamps
    scan_date DATE,
    scan_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_symbol (stock_symbol),
    INDEX idx_scanner (scanner_type),
    INDEX idx_date (scan_date),
    INDEX idx_confidence (confidence)
);

-- Scanner Presets Table
CREATE TABLE scanner_presets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    scanner_type VARCHAR(50) NOT NULL,
    preset_name VARCHAR(100) NOT NULL,
    parameters JSON NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_preset (user_id, scanner_type, preset_name),
    INDEX idx_user (user_id),
    INDEX idx_scanner (scanner_type)
);

-- Watchlists Table
CREATE TABLE watchlists (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    stocks JSON,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
);

-- Alerts Table
CREATE TABLE alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    -- Alert details
    alert_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    
    -- Target
    stock_symbol VARCHAR(20),
    scanner_type VARCHAR(50),
    
    -- Conditions
    condition_type VARCHAR(50),
    condition_value DECIMAL(10,2),
    
    -- Status
    status ENUM('pending', 'triggered', 'dismissed') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    
    -- Trigger info
    triggered_at TIMESTAMP NULL,
    trigger_value DECIMAL(10,2),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_type (alert_type)
);

-- Activity Logs Table
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    -- Activity details
    action_type VARCHAR(50) NOT NULL,
    action_details TEXT,
    
    -- User info
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_action (action_type),
    INDEX idx_date (created_at)
);

-- Market Data Cache
CREATE TABLE market_data_cache (
    id INT PRIMARY KEY AUTO_INCREMENT,
    stock_symbol VARCHAR(20) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    data JSON NOT NULL,
    
    -- Cache control
    expires_at TIMESTAMP NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_cache (stock_symbol, data_type),
    INDEX idx_symbol (stock_symbol),
    INDEX idx_expiry (expires_at)
);

-- Nifty Stocks Reference
CREATE TABLE nifty_stocks (
    symbol VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sector VARCHAR(100),
    market_cap DECIMAL(20,2),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sector (sector),
    INDEX idx_active (is_active)
);

-- Insert default Nifty 50 stocks
INSERT INTO nifty_stocks (symbol, name, sector) VALUES
('RELIANCE', 'Reliance Industries Ltd', 'Energy'),
('TCS', 'Tata Consultancy Services Ltd', 'IT'),
('HDFCBANK', 'HDFC Bank Ltd', 'Banking'),
('INFY', 'Infosys Ltd', 'IT'),
('ICICIBANK', 'ICICI Bank Ltd', 'Banking'),
('HINDUNILVR', 'Hindustan Unilever Ltd', 'FMCG'),
('ITC', 'ITC Ltd', 'FMCG'),
('SBIN', 'State Bank of India', 'Banking'),
('BHARTIARTL', 'Bharti Airtel Ltd', 'Telecom'),
('KOTAKBANK', 'Kotak Mahindra Bank Ltd', 'Banking'),
('WIPRO', 'Wipro Ltd', 'IT'),
('AXISBANK', 'Axis Bank Ltd', 'Banking'),
('LT', 'Larsen & Toubro Ltd', 'Construction'),
('BAJFINANCE', 'Bajaj Finance Ltd', 'Financial Services'),
('ASIANPAINT', 'Asian Paints Ltd', 'Consumer Goods'),
('MARUTI', 'Maruti Suzuki India Ltd', 'Automobile'),
('ULTRACEMCO', 'UltraTech Cement Ltd', 'Cement'),
('TITAN', 'Titan Company Ltd', 'Consumer Goods'),
('SUNPHARMA', 'Sun Pharmaceutical Industries Ltd', 'Pharmaceuticals'),
('BAJAJFINSV', 'Bajaj Finserv Ltd', 'Financial Services'),
('ONGC', 'Oil & Natural Gas Corporation Ltd', 'Energy'),
('NTPC', 'NTPC Ltd', 'Power'),
('POWERGRID', 'Power Grid Corporation of India Ltd', 'Power'),
('M&M', 'Mahindra & Mahindra Ltd', 'Automobile'),
('TATAMOTORS', 'Tata Motors Ltd', 'Automobile'),
('TATASTEEL', 'Tata Steel Ltd', 'Metals'),
('JSWSTEEL', 'JSW Steel Ltd', 'Metals'),
('HCLTECH', 'HCL Technologies Ltd', 'IT'),
('TECHM', 'Tech Mahindra Ltd', 'IT'),
('INDUSINDBK', 'IndusInd Bank Ltd', 'Banking'),
('GRASIM', 'Grasim Industries Ltd', 'Cement'),
('ADANIPORTS', 'Adani Ports and Special Economic Zone Ltd', 'Infrastructure'),
('SHREECEM', 'Shree Cement Ltd', 'Cement'),
('DRREDDY', 'Dr. Reddy''s Laboratories Ltd', 'Pharmaceuticals'),
('HDFC', 'Housing Development Finance Corporation Ltd', 'Financial Services'),
('BRITANNIA', 'Britannia Industries Ltd', 'FMCG'),
('DIVISLAB', 'Divis Laboratories Ltd', 'Pharmaceuticals'),
('EICHERMOT', 'Eicher Motors Ltd', 'Automobile'),
('HEROMOTOCO', 'Hero MotoCorp Ltd', 'Automobile'),
('BAJAJ-AUTO', 'Bajaj Auto Ltd', 'Automobile'),
('COALINDIA', 'Coal India Ltd', 'Mining'),
('IOC', 'Indian Oil Corporation Ltd', 'Energy'),
('BPCL', 'Bharat Petroleum Corporation Ltd', 'Energy'),
('GAIL', 'GAIL (India) Ltd', 'Energy'),
('HINDALCO', 'Hindalco Industries Ltd', 'Metals');

-- Create admin user (password: Admin@123)
INSERT INTO users (email, password_hash, full_name, is_admin, status, subscription_type, subscription_start, subscription_end) 
VALUES ('admin@incomeplus.in', '$2y$10$YourHashedPasswordHere', 'Administrator', TRUE, 'active', 'annual', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR));

-- Create indexes for performance
CREATE INDEX idx_scan_results_user_date ON scan_results(user_id, scan_date DESC);
CREATE INDEX idx_alerts_user_status ON alerts(user_id, status);
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX idx_activity_user_date ON activity_logs(user_id, created_at DESC);

-- Create views for reporting
CREATE VIEW user_subscription_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    u.subscription_type,
    u.subscription_end,
    u.status,
    COUNT(DISTINCT s.id) as total_scans,
    MAX(sr.scan_date) as last_scan_date
FROM users u
LEFT JOIN scan_results sr ON u.id = sr.user_id
LEFT JOIN subscriptions s ON u.id = s.user_id
GROUP BY u.id, u.email, u.full_name, u.subscription_type, u.subscription_end, u.status;

CREATE VIEW scanner_performance AS
SELECT 
    scanner_type,
    COUNT(*) as total_scans,
    AVG(confidence) as avg_confidence,
    COUNT(CASE WHEN confidence >= 80 THEN 1 END) as high_confidence_scans,
    COUNT(DISTINCT stock_symbol) as unique_stocks_scanned,
    DATE(created_at) as scan_date
FROM scan_results
GROUP BY scanner_type, DATE(created_at);

-- Stored procedure for cleaning old data
DELIMITER //
CREATE PROCEDURE clean_old_data()
BEGIN
    -- Delete scan results older than 1 year
    DELETE FROM scan_results WHERE scan_date < DATE_SUB(CURDATE(), INTERVAL 1 YEAR);
    
    -- Delete activity logs older than 6 months
    DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
    
    -- Delete expired market data cache
    DELETE FROM market_data_cache WHERE expires_at < NOW();
    
    -- Update expired subscriptions
    UPDATE users SET status = 'expired' WHERE subscription_end < CURDATE() AND status = 'active';
    
    UPDATE subscriptions SET status = 'expired' WHERE end_date < CURDATE() AND status = 'active';
END//
DELIMITER ;

-- Event scheduler for daily cleanup
SET GLOBAL event_scheduler = ON;
CREATE EVENT daily_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '03:00:00')
DO
CALL clean_old_data();
