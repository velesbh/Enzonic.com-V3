-- Privacy Management System Database Schema

-- Privacy requests table
CREATE TABLE IF NOT EXISTS privacy_requests (
    id VARCHAR(50) PRIMARY KEY,
    type ENUM('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection', 'withdraw_consent', 'ccpa_opt_out') NOT NULL,
    description TEXT,
    user_data JSON,
    status ENUM('pending', 'in_progress', 'completed', 'rejected') DEFAULT 'pending',
    notes TEXT,
    admin_notes TEXT,
    requested_by VARCHAR(255),
    processed_by VARCHAR(255),
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_requested_by (requested_by),
    INDEX idx_created_at (created_at)
);

-- Privacy audit log
CREATE TABLE IF NOT EXISTS privacy_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    description TEXT,
    admin_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES privacy_requests(id) ON DELETE CASCADE,
    INDEX idx_request_id (request_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_created_at (created_at)
);

-- User data restrictions
CREATE TABLE IF NOT EXISTS user_data_restrictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    restriction_type VARCHAR(100) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(255),
    removed_at TIMESTAMP NULL,
    removed_by VARCHAR(255),
    UNIQUE KEY unique_user_restriction (user_id, restriction_type),
    INDEX idx_user_id (user_id),
    INDEX idx_restriction_type (restriction_type)
);

-- User consent tracking
CREATE TABLE IF NOT EXISTS user_consent (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    consent_type VARCHAR(100) NOT NULL,
    status ENUM('granted', 'withdrawn', 'expired') NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    UNIQUE KEY unique_user_consent (user_id, consent_type),
    INDEX idx_user_id (user_id),
    INDEX idx_consent_type (consent_type),
    INDEX idx_status (status)
);

-- Data export logs
CREATE TABLE IF NOT EXISTS data_exports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    request_id VARCHAR(50),
    filename VARCHAR(255),
    format ENUM('json', 'csv', 'xml') DEFAULT 'json',
    file_size BIGINT,
    download_count INT DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    FOREIGN KEY (request_id) REFERENCES privacy_requests(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_request_id (request_id),
    INDEX idx_expires_at (expires_at)
);

-- Privacy settings and preferences
CREATE TABLE IF NOT EXISTS privacy_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    data_processing_consent BOOLEAN DEFAULT FALSE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    analytics_consent BOOLEAN DEFAULT FALSE,
    ai_training_consent BOOLEAN DEFAULT FALSE,
    data_sharing_consent BOOLEAN DEFAULT FALSE,
    ccpa_opt_out BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
);

-- Enhanced users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_clerk_id (clerk_id),
    INDEX idx_email (email)
);

-- Chat history table (enhanced for privacy)
CREATE TABLE IF NOT EXISTS chat_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    message_id VARCHAR(255),
    user_message TEXT,
    assistant_message TEXT,
    model VARCHAR(100),
    tokens_used INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deletion_reason VARCHAR(255),
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_deleted (is_deleted)
);

-- Translation history table (enhanced for privacy)
CREATE TABLE IF NOT EXISTS translation_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    source_text TEXT,
    translated_text TEXT,
    source_language VARCHAR(10),
    target_language VARCHAR(10),
    service_used VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deletion_reason VARCHAR(255),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_deleted (is_deleted)
);

-- User activities table (enhanced for privacy)
CREATE TABLE IF NOT EXISTS user_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    activity_data JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at),
    INDEX idx_is_deleted (is_deleted)
);

-- API usage logs (enhanced for privacy)
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    service_id VARCHAR(100),
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INT,
    response_time INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    INDEX idx_user_id (user_id),
    INDEX idx_service_id (service_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_is_deleted (is_deleted)
);

-- User preferences table (enhanced for privacy)
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE KEY unique_user_preference (user_id, preference_key),
    INDEX idx_user_id (user_id),
    INDEX idx_preference_key (preference_key),
    INDEX idx_is_deleted (is_deleted)
);

-- Insert default privacy settings for existing users
INSERT IGNORE INTO privacy_settings (user_id, data_processing_consent, marketing_consent, analytics_consent, ai_training_consent, data_sharing_consent)
SELECT clerk_id, TRUE, FALSE, FALSE, FALSE, FALSE FROM users;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_user_date ON chat_history(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_translation_user_date ON translation_history(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_user_date ON user_activities(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_user_date ON api_usage_logs(user_id, timestamp);