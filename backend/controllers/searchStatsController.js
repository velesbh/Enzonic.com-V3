import db from '../utils/database.js';

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

    await db.query(
      `INSERT INTO search_statistics 
       (search_query, search_category, results_count, language, filters, user_id, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [query, category, results_count, language, JSON.stringify(filters), user_id, ip_address]
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
    
    let interval = '24 hours';
    if (timeframe === '7d') interval = '7 days';
    if (timeframe === '30d') interval = '30 days';
    if (timeframe === '1y') interval = '1 year';

    // Total searches in timeframe
    const totalSearchesResult = await db.query(
      `SELECT COUNT(*) as total FROM search_statistics 
       WHERE search_timestamp > NOW() - INTERVAL '${interval}'`
    );

    // Unique users in timeframe
    const uniqueUsersResult = await db.query(
      `SELECT COUNT(DISTINCT COALESCE(user_id, ip_address)) as unique_users 
       FROM search_statistics 
       WHERE search_timestamp > NOW() - INTERVAL '${interval}'`
    );

    // Average results per search
    const avgResultsResult = await db.query(
      `SELECT AVG(results_count) as avg_results 
       FROM search_statistics 
       WHERE search_timestamp > NOW() - INTERVAL '${interval}'`
    );

    // Searches by category
    const categoriesResult = await db.query(
      `SELECT search_category, COUNT(*) as count 
       FROM search_statistics 
       WHERE search_timestamp > NOW() - INTERVAL '${interval}'
       GROUP BY search_category 
       ORDER BY count DESC`
    );

    // Searches over time (hourly for 24h, daily for longer)
    let timeUnit = timeframe === '24h' ? 'hour' : 'day';
    const timeSeriesResult = await db.query(
      `SELECT 
        DATE_TRUNC('${timeUnit}', search_timestamp) as time_bucket,
        COUNT(*) as searches
       FROM search_statistics 
       WHERE search_timestamp > NOW() - INTERVAL '${interval}'
       GROUP BY time_bucket 
       ORDER BY time_bucket ASC`
    );

    res.json({
      timeframe,
      total_searches: parseInt(totalSearchesResult.rows[0]?.total || 0),
      unique_users: parseInt(uniqueUsersResult.rows[0]?.unique_users || 0),
      avg_results: parseFloat(avgResultsResult.rows[0]?.avg_results || 0).toFixed(2),
      categories: categoriesResult.rows,
      time_series: timeSeriesResult.rows
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// Get popular searches
export const getPopularSearches = async (req, res) => {
  try {
    const { limit = 20, timeframe = '30d' } = req.query;
    
    let interval = '30 days';
    if (timeframe === '24h') interval = '24 hours';
    if (timeframe === '7d') interval = '7 days';
    if (timeframe === '1y') interval = '1 year';

    const result = await db.query(
      `SELECT 
        search_query,
        COUNT(*) as search_count,
        MAX(search_timestamp) as last_searched,
        AVG(results_count) as avg_results
       FROM search_statistics 
       WHERE search_timestamp > NOW() - INTERVAL '${interval}'
       GROUP BY search_query 
       ORDER BY search_count DESC 
       LIMIT $1`,
      [limit]
    );

    res.json({ popular_searches: result.rows });
  } catch (error) {
    console.error('Error fetching popular searches:', error);
    res.status(500).json({ error: 'Failed to fetch popular searches' });
  }
};

// Get recent searches
export const getRecentSearches = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const result = await db.query(
      `SELECT 
        id,
        search_query,
        search_category,
        results_count,
        search_timestamp,
        language
       FROM search_statistics 
       ORDER BY search_timestamp DESC 
       LIMIT $1`,
      [limit]
    );

    res.json({ recent_searches: result.rows });
  } catch (error) {
    console.error('Error fetching recent searches:', error);
    res.status(500).json({ error: 'Failed to fetch recent searches' });
  }
};

// Get search trends
export const getSearchTrends = async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    let interval = '7 days';
    if (timeframe === '24h') interval = '24 hours';
    if (timeframe === '30d') interval = '30 days';

    // Get trending searches (increasing in popularity)
    const result = await db.query(
      `WITH recent_half AS (
        SELECT search_query, COUNT(*) as recent_count
        FROM search_statistics
        WHERE search_timestamp > NOW() - INTERVAL '${interval}' / 2
        GROUP BY search_query
      ),
      older_half AS (
        SELECT search_query, COUNT(*) as older_count
        FROM search_statistics
        WHERE search_timestamp BETWEEN NOW() - INTERVAL '${interval}' AND NOW() - INTERVAL '${interval}' / 2
        GROUP BY search_query
      )
      SELECT 
        COALESCE(r.search_query, o.search_query) as search_query,
        COALESCE(r.recent_count, 0) as recent_count,
        COALESCE(o.older_count, 0) as older_count,
        CASE 
          WHEN COALESCE(o.older_count, 0) = 0 THEN 100
          ELSE ((COALESCE(r.recent_count, 0)::float - COALESCE(o.older_count, 0)) / COALESCE(o.older_count, 0) * 100)
        END as trend_percentage
      FROM recent_half r
      FULL OUTER JOIN older_half o ON r.search_query = o.search_query
      WHERE COALESCE(r.recent_count, 0) > 2
      ORDER BY trend_percentage DESC
      LIMIT 20`
    );

    res.json({ trending_searches: result.rows });
  } catch (error) {
    console.error('Error fetching search trends:', error);
    res.status(500).json({ error: 'Failed to fetch search trends' });
  }
};

export default {
  logSearch,
  getStatistics,
  getPopularSearches,
  getRecentSearches,
  getSearchTrends
};
