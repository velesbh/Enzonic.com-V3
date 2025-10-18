-- Search Statistics Schema
CREATE TABLE IF NOT EXISTS search_statistics (
  id SERIAL PRIMARY KEY,
  search_query TEXT NOT NULL,
  search_category VARCHAR(50) DEFAULT 'general',
  results_count INTEGER DEFAULT 0,
  search_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(255),
  language VARCHAR(10),
  filters JSONB,
  ip_address VARCHAR(45)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_search_timestamp ON search_statistics(search_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_search_query ON search_statistics(search_query);
CREATE INDEX IF NOT EXISTS idx_search_category ON search_statistics(search_category);
CREATE INDEX IF NOT EXISTS idx_user_id ON search_statistics(user_id);

-- Popular searches view
CREATE OR REPLACE VIEW popular_searches AS
SELECT 
  search_query,
  COUNT(*) as search_count,
  MAX(search_timestamp) as last_searched
FROM search_statistics
WHERE search_timestamp > NOW() - INTERVAL '30 days'
GROUP BY search_query
ORDER BY search_count DESC
LIMIT 100;

-- Daily statistics view
CREATE OR REPLACE VIEW daily_search_stats AS
SELECT 
  DATE(search_timestamp) as search_date,
  COUNT(*) as total_searches,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(results_count) as avg_results
FROM search_statistics
GROUP BY DATE(search_timestamp)
ORDER BY search_date DESC;
