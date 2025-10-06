import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Initialize database and create tables
export async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create translation_history table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS translation_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        source_text TEXT NOT NULL,
        translated_text TEXT NOT NULL,
        source_language VARCHAR(10) NOT NULL,
        target_language VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      )
    `);

    // Create admin_data table for storing environment variables, service configs, etc.
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        translation_data TEXT,
        your_data TEXT,
        data_type VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_data_type (data_type)
      )
    `);

    // Create service configurations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS service_configs (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        logo VARCHAR(500),
        icon VARCHAR(100),
        description TEXT,
        enabled BOOLEAN DEFAULT true,
        endpoint VARCHAR(255),
        color VARCHAR(20),
        config_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create statistics table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS statistics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        metric_name VARCHAR(100) NOT NULL,
        metric_value JSON NOT NULL,
        service_id VARCHAR(50),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_metric_name (metric_name),
        INDEX idx_service_id (service_id),
        INDEX idx_recorded_at (recorded_at)
      )
    `);

    // Create API usage logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS api_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255),
        service_id VARCHAR(50),
        endpoint VARCHAR(255),
        method VARCHAR(10),
        status_code INT,
        response_time INT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_service_id (service_id),
        INDEX idx_created_at (created_at)
      )
    `);

    // Insert default service configurations if they don't exist
    await initializeDefaultServices(connection);
    
    console.log('Database tables created successfully');
    connection.release();
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Save translation to history
export async function saveTranslation(userId, sourceText, translatedText, sourceLang, targetLang) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO translation_history (user_id, source_text, translated_text, source_language, target_language) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, sourceText, translatedText, sourceLang, targetLang]
    );
    
    // Keep only last 5 translations for this user
    await pool.execute(
      `DELETE FROM translation_history 
       WHERE user_id = ? 
       AND id NOT IN (
         SELECT id FROM (
           SELECT id FROM translation_history 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT 5
         ) AS keep_records
       )`,
      [userId, userId]
    );
    
    return result.insertId;
  } catch (error) {
    console.error('Error saving translation:', error);
    throw error;
  }
}

// Get translation history for user
export async function getTranslationHistory(userId) {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM translation_history 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching translation history:', error);
    throw error;
  }
}

// Generic admin data functions
export async function saveUserData(userId, data) {
  try {
    const [result] = await pool.execute(
      'INSERT INTO admin_data (user_id, your_data, translation_data) VALUES (?, ?, ?)',
      [userId, JSON.stringify(data), JSON.stringify(data)]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
}

export async function getUserData(userId, limit = 10) {
  try {
    let query = 'SELECT * FROM admin_data';
    let params = [];
    
    if (userId !== 'all') {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return [];
  }
}

export async function updateUserData(id, userId, data) {
  try {
    const [result] = await pool.execute(
      'UPDATE admin_data SET your_data = ?, translation_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [JSON.stringify(data), JSON.stringify(data), id, userId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
}

export async function deleteUserData(id, userId) {
  try {
    const [result] = await pool.execute(
      'DELETE FROM admin_data WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw error;
  }
}

// Initialize default service configurations
async function initializeDefaultServices(connection) {
  try {
    const defaultServices = [
      {
        id: 'translate',
        name: 'AI Translate',
        logo: '/src/assets/translate-logo.png',
        icon: 'Languages',
        description: 'Advanced AI-powered translation service with support for 100+ languages',
        enabled: true,
        endpoint: '/translate',
        color: '#3B82F6'
      },
      {
        id: 'boxes',
        name: 'Boxes',
        logo: '/src/assets/boxes-logo.png',
        icon: 'Package',
        description: 'Smart package management and organization system',
        enabled: true,
        endpoint: '/boxes',
        color: '#10B981'
      },
      {
        id: 'emi',
        name: 'Enzonic Emi',
        logo: '/src/assets/emi-logo.png',
        icon: 'Brain',
        description: 'Advanced AI Discord bot with memory and intelligent message handling',
        enabled: true,
        endpoint: '/emi',
        color: '#F59E0B'
      }
    ];

    for (const service of defaultServices) {
      await connection.execute(`
        INSERT INTO service_configs (id, name, logo, icon, description, enabled, endpoint, color, config_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        icon = VALUES(icon),
        description = VALUES(description),
        endpoint = VALUES(endpoint),
        color = VALUES(color),
        updated_at = CURRENT_TIMESTAMP
      `, [
        service.id,
        service.name,
        service.logo,
        service.icon,
        service.description,
        service.enabled,
        service.endpoint,
        service.color,
        JSON.stringify(service)
      ]);
    }
  } catch (error) {
    console.error('Error initializing default services:', error);
  }
}

// Service configuration functions
export async function getServiceConfigurations() {
  try {
    const [rows] = await pool.execute('SELECT * FROM service_configs ORDER BY id');
    return rows.map(row => ({
      ...JSON.parse(row.config_data || '{}'),
      id: row.id,
      name: row.name,
      logo: row.logo,
      icon: row.icon,
      description: row.description,
      enabled: Boolean(row.enabled),
      endpoint: row.endpoint,
      color: row.color
    }));
  } catch (error) {
    console.error('Error fetching service configurations:', error);
    return [];
  }
}

export async function updateServiceConfiguration(serviceId, config) {
  try {
    const [result] = await pool.execute(`
      UPDATE service_configs 
      SET name = ?, logo = ?, icon = ?, description = ?, enabled = ?, endpoint = ?, color = ?, config_data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      config.name,
      config.logo,
      config.icon,
      config.description,
      config.enabled,
      config.endpoint,
      config.color,
      JSON.stringify(config),
      serviceId
    ]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating service configuration:', error);
    throw error;
  }
}

// Statistics functions
export async function recordStatistic(metricName, metricValue, serviceId = null) {
  try {
    await pool.execute(
      'INSERT INTO statistics (metric_name, metric_value, service_id) VALUES (?, ?, ?)',
      [metricName, JSON.stringify(metricValue), serviceId]
    );
  } catch (error) {
    console.error('Error recording statistic:', error);
  }
}

export async function getStatistics(metricName = null, hours = 24) {
  try {
    let query = 'SELECT * FROM statistics WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)';
    const params = [hours];
    
    if (metricName) {
      query += ' AND metric_name = ?';
      params.push(metricName);
    }
    
    query += ' ORDER BY recorded_at DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows.map(row => ({
      ...row,
      metric_value: JSON.parse(row.metric_value)
    }));
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return [];
  }
}

// API usage logging
export async function logApiUsage(userId, serviceId, endpoint, method, statusCode, responseTime, ipAddress, userAgent) {
  try {
    await pool.execute(`
      INSERT INTO api_usage (user_id, service_id, endpoint, method, status_code, response_time, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, serviceId, endpoint, method, statusCode, responseTime, ipAddress, userAgent]);
  } catch (error) {
    console.error('Error logging API usage:', error);
  }
}

export async function getApiUsageStats(hours = 24) {
  try {
    const [totalCalls] = await pool.execute(
      'SELECT COUNT(*) as count FROM api_usage WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)',
      [hours]
    );
    
    const [userCount] = await pool.execute(
      'SELECT COUNT(DISTINCT user_id) as count FROM api_usage WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)',
      [hours]
    );
    
    const [serviceStats] = await pool.execute(`
      SELECT service_id, COUNT(*) as usage_count, AVG(response_time) as avg_response_time
      FROM api_usage 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
      GROUP BY service_id
    `, [hours]);
    
    return {
      totalCalls: totalCalls[0].count,
      uniqueUsers: userCount[0].count,
      serviceStats: serviceStats.reduce((acc, stat) => {
        acc[stat.service_id || 'unknown'] = {
          usage: stat.usage_count,
          avgResponseTime: Math.round(stat.avg_response_time || 0)
        };
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Error fetching API usage stats:', error);
    return { totalCalls: 0, uniqueUsers: 0, serviceStats: {} };
  }
}

// Service availability functions
export async function checkServiceAvailability(serviceId) {
  try {
    const [rows] = await pool.execute(
      'SELECT enabled FROM service_configs WHERE id = ?',
      [serviceId]
    );
    return rows.length > 0 ? Boolean(rows[0].enabled) : false;
  } catch (error) {
    console.error('Error checking service availability:', error);
    return false;
  }
}

export async function getAllServiceStatuses() {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, enabled, endpoint FROM service_configs'
    );
    return rows.reduce((acc, service) => {
      acc[service.id] = {
        name: service.name,
        enabled: Boolean(service.enabled),
        endpoint: service.endpoint
      };
      return acc;
    }, {});
  } catch (error) {
    console.error('Error getting service statuses:', error);
    return {};
  }
}

// Real-time statistics tracking
export async function recordUserActivity(userId, activity, details = {}) {
  try {
    await recordStatistic('user_activity', {
      userId,
      activity,
      details,
      timestamp: new Date().toISOString(),
      sessionId: details.sessionId || null
    });
  } catch (error) {
    console.error('Error recording user activity:', error);
  }
}

export async function getRealtimeStatistics() {
  try {
    // Get statistics from last 5 minutes for real-time feel
    const [activeUsers] = await pool.execute(
      `SELECT COUNT(DISTINCT JSON_EXTRACT(metric_value, '$.userId')) as count 
       FROM statistics 
       WHERE metric_name = 'user_activity' 
       AND recorded_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)`
    );
    
    const [recentTranslations] = await pool.execute(
      'SELECT COUNT(*) as count FROM translation_history WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)'
    );
    
    const [recentApiCalls] = await pool.execute(
      'SELECT COUNT(*) as count FROM api_usage WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)'
    );
    
    return {
      activeUsers: activeUsers[0].count || 0,
      recentTranslations: recentTranslations[0].count || 0,
      recentApiCalls: recentApiCalls[0].count || 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting realtime statistics:', error);
    return {
      activeUsers: 0,
      recentTranslations: 0,
      recentApiCalls: 0,
      timestamp: new Date().toISOString()
    };
  }
}

// System health monitoring
export async function getSystemHealthMetrics() {
  try {
    // Database health check
    const startTime = Date.now();
    await pool.execute('SELECT 1');
    const dbResponseTime = Date.now() - startTime;
    
    // Get recent error counts
    const [errorCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM api_usage WHERE status_code >= 400 AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)'
    );
    
    return {
      database: {
        status: 'healthy',
        responseTime: dbResponseTime,
        connectionCount: pool.pool?.config?.connectionLimit || 10
      },
      api: {
        status: 'healthy',
        errorRate: errorCount[0].count,
        uptime: process.uptime()
      }
    };
  } catch (error) {
    console.error('Error getting system health metrics:', error);
    return {
      database: { status: 'unhealthy', responseTime: null },
      api: { status: 'unhealthy', errorRate: null, uptime: null }
    };
  }
}

export default pool;