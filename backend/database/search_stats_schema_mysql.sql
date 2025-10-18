-- Search Statistics Schema (MySQL)
CREATE TABLE IF NOT EXISTS search_statistics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  search_query TEXT NOT NULL,
  search_category VARCHAR(50) DEFAULT 'general',
  results_count INT DEFAULT 0,
  search_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(255),
  language VARCHAR(10),
  filters JSON,
  ip_address VARCHAR(45),
  INDEX idx_search_timestamp (search_timestamp),
  INDEX idx_search_category (search_category),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
