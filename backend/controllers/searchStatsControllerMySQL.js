import pool from '../database/config.js';

// Log a search query
export const logSearch = async (req, res) => {
  try {
    const { 
      query, 
      category = 'general', 
      results_count = 0, 
      language, 
      filters,
      user_id 
    } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Convert undefined to null for MySQL
    await pool.execute(
      `INSERT INTO search_statistics 
       (search_query, search_category, results_count, language, filters, user_id, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        query, 
        category, 
        results_count, 
        language || null, 
        filters ? JSON.stringify(filters) : null, 
        user_id || null, 
        ip_address || null
      ]
    );

    res.json({ success: true, message: 'Search logged successfully' });
  } catch (error) {
    console.error('Error logging search:', error);
    res.status(500).json({ error: 'Failed to log search' });
  }
};

// Get search statistics overview
export const getStatistics = async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    let intervalHours = 24;
    if (timeframe === '7d') intervalHours = 24 * 7;
    if (timeframe === '30d') intervalHours = 24 * 30;
    if (timeframe === '1y') intervalHours = 24 * 365;

    // Total searches in timeframe
    const [totalSearchesResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM search_statistics 
       WHERE search_timestamp > DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [intervalHours]
    );

    // Unique users in timeframe
    const [uniqueUsersResult] = await pool.execute(
      `SELECT COUNT(DISTINCT COALESCE(user_id, ip_address)) as unique_users 
       FROM search_statistics 
       WHERE search_timestamp > DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [intervalHours]
    );

    // Average results per search
    const [avgResultsResult] = await pool.execute(
      `SELECT AVG(results_count) as avg_results 
       FROM search_statistics 
       WHERE search_timestamp > DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [intervalHours]
    );

    // Searches by category
    const [categoriesResult] = await pool.execute(
      `SELECT search_category, COUNT(*) as count 
       FROM search_statistics 
       WHERE search_timestamp > DATE_SUB(NOW(), INTERVAL ? HOUR)
       GROUP BY search_category 
       ORDER BY count DESC`,
      [intervalHours]
    );

    // Searches over time (hourly for 24h, daily for longer)
    let timeFormat = timeframe === '24h' ? '%Y-%m-%d %H:00:00' : '%Y-%m-%d';
    const [timeSeriesResult] = await pool.execute(
      `SELECT 
        DATE_FORMAT(search_timestamp, ?) as time_bucket,
        COUNT(*) as searches
       FROM search_statistics 
       WHERE search_timestamp > DATE_SUB(NOW(), INTERVAL ? HOUR)
       GROUP BY time_bucket 
       ORDER BY time_bucket ASC`,
      [timeFormat, intervalHours]
    );

    res.json({
      timeframe,
      total_searches: parseInt(totalSearchesResult[0]?.total || 0),
      unique_users: parseInt(uniqueUsersResult[0]?.unique_users || 0),
      avg_results: parseFloat(avgResultsResult[0]?.avg_results || 0).toFixed(2),
      categories: categoriesResult,
      time_series: timeSeriesResult
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// Get popular searches
export const getPopularSearches = async (req, res) => {
  try {
    const { timeframe = '30d', limit = 20 } = req.query;
    
    let intervalHours = 24 * 30;
    if (timeframe === '24h') intervalHours = 24;
    if (timeframe === '7d') intervalHours = 24 * 7;
    if (timeframe === '1y') intervalHours = 24 * 365;

    const [results] = await pool.execute(
      `SELECT 
        search_query,
        COUNT(*) as search_count,
        AVG(results_count) as avg_results,
        MAX(search_timestamp) as last_searched
       FROM search_statistics 
       WHERE search_timestamp > DATE_SUB(NOW(), INTERVAL ? HOUR)
       GROUP BY search_query 
       ORDER BY search_count DESC 
       LIMIT ?`,
      [intervalHours, parseInt(limit)]
    );

    res.json({ popular_searches: results });
  } catch (error) {
    console.error('Error fetching popular searches:', error);
    res.status(500).json({ error: 'Failed to fetch popular searches' });
  }
};

// Get recent searches
export const getRecentSearches = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const [results] = await pool.execute(
      `SELECT 
        search_query,
        search_category,
        results_count,
        search_timestamp,
        language
       FROM search_statistics 
       ORDER BY search_timestamp DESC 
       LIMIT ?`,
      [parseInt(limit)]
    );

    res.json({ recent_searches: results });
  } catch (error) {
    console.error('Error fetching recent searches:', error);
    res.status(500).json({ error: 'Failed to fetch recent searches' });
  }
};

// Get trending searches (comparing recent vs older period)
export const getSearchTrends = async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    let intervalHours = 24 * 7;
    if (timeframe === '24h') intervalHours = 24;
    if (timeframe === '30d') intervalHours = 24 * 30;

    // Get searches from recent half of the period
    const recentStart = intervalHours / 2;
    
    const [results] = await pool.execute(
      `SELECT 
        search_query,
        SUM(CASE WHEN search_timestamp > DATE_SUB(NOW(), INTERVAL ? HOUR) THEN 1 ELSE 0 END) as recent_count,
        SUM(CASE WHEN search_timestamp BETWEEN DATE_SUB(NOW(), INTERVAL ? HOUR) AND DATE_SUB(NOW(), INTERVAL ? HOUR) THEN 1 ELSE 0 END) as older_count
       FROM search_statistics 
       WHERE search_timestamp > DATE_SUB(NOW(), INTERVAL ? HOUR)
       GROUP BY search_query 
       HAVING recent_count > 0 AND older_count > 0
       ORDER BY (recent_count / NULLIF(older_count, 1)) DESC 
       LIMIT 20`,
      [recentStart, intervalHours, recentStart, intervalHours]
    );

    // Calculate percentage change
    const trending = results.map(row => ({
      search_query: row.search_query,
      recent_count: row.recent_count,
      older_count: row.older_count,
      trend_percentage: ((row.recent_count - row.older_count) / row.older_count * 100).toFixed(2)
    }));

    res.json({ trending_searches: trending });
  } catch (error) {
    console.error('Error fetching search trends:', error);
    res.status(500).json({ error: 'Failed to fetch search trends' });
  }
};
