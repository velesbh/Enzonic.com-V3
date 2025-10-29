import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '../.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Create chat_history table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        user_message TEXT NOT NULL,
        assistant_message TEXT NOT NULL,
        model VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at),
        INDEX idx_model (model)
      )
    `);

    // Create chat_sessions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        session_name VARCHAR(255) NOT NULL,
        messages JSON NOT NULL,
        model VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_session_id (session_id),
        INDEX idx_created_at (created_at),
        INDEX idx_model (model),
        UNIQUE KEY unique_user_session (user_id, session_id)
      )
    `);

    // Create search_statistics table
    await connection.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Insert default service configurations if they don't exist
    await initializeDefaultServices(connection);
    
    // Run automatic migrations
    await runMigrations(connection);
    
    console.log('Database tables created successfully');
    connection.release();
  } catch (error) {
    console.error('Error initializing database:', error);
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
        id: 'chatbot',
        name: 'AI Chatbot',
        logo: null,
        icon: 'MessageCircle',
        description: 'Intelligent conversational AI with multiple specialized models',
        enabled: true,
        endpoint: '/chatbot',
        color: '#8B5CF6'
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

// Song enhancements migration function
async function runSongEnhancementsMigration(connection) {
  try {
    console.log('  → Checking song enhancements migration...');

    // Check if song_collaborators table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME IN ('song_collaborators', 'artist_followers', 'song_statistics', 'artist_statistics')
    `, [dbConfig.database]);

    const existingTables = tables.map(row => row.TABLE_NAME);

    if (!existingTables.includes('song_collaborators')) {
      console.log('    → Creating song enhancements tables...');

      // Read the schema file
      const schemaPath = path.join(__dirname, 'song_enhancements_schema.sql');
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

      // Split into individual statements
      const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await connection.execute(statement);
          } catch (error) {
            // Ignore "already exists" errors for idempotent operations
            if (!error.message.includes('already exists') &&
                !error.message.includes('Duplicate entry') &&
                !error.message.includes('Duplicate key')) {
              throw error;
            }
          }
        }
      }

      console.log('    ✓ Song enhancements tables created successfully');
    } else {
      console.log('    ✓ Song enhancements tables already exist');
    }

    // Check if enhanced columns exist in songs table
    const [songColumns] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'songs'
      AND COLUMN_NAME IN ('story', 'social_links', 'copyright_info')
    `, [dbConfig.database]);

    // Add enhanced columns to songs table if they don't exist
    if (songColumns.length < 3) {
      console.log('    → Adding enhanced columns to songs table...');

      if (!songColumns.some(col => col.COLUMN_NAME === 'story')) {
        await connection.execute(`
          ALTER TABLE songs ADD COLUMN story TEXT NULL AFTER has_lyrics
        `);
        console.log('      ✓ Added story column');
      }

      if (!songColumns.some(col => col.COLUMN_NAME === 'social_links')) {
        await connection.execute(`
          ALTER TABLE songs ADD COLUMN social_links JSON NULL AFTER story
        `);
        console.log('      ✓ Added social_links column');
      }

      if (!songColumns.some(col => col.COLUMN_NAME === 'copyright_info')) {
        await connection.execute(`
          ALTER TABLE songs ADD COLUMN copyright_info TEXT NULL AFTER social_links
        `);
        console.log('      ✓ Added copyright_info column');
      }
    }

    // Check if enhanced columns exist in artists table
    const [artistColumns] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'artists'
      AND COLUMN_NAME = 'social_links'
    `, [dbConfig.database]);

    // Add social_links column to artists table if it doesn't exist
    if (artistColumns.length === 0) {
      console.log('    → Adding social_links column to artists table...');
      await connection.execute(`
        ALTER TABLE artists ADD COLUMN social_links JSON NULL AFTER bio
      `);
      console.log('      ✓ Added social_links column to artists table');
    }

  } catch (error) {
    console.error('    ✗ Error in song enhancements migration:', error);
    // Don't throw - let the app continue even if migration fails
  }
}

// Tags system migration function
async function runTagsMigration(connection) {
  try {
    console.log('  → Checking tags system migration...');

    // Check if tag_categories table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME IN ('tag_categories', 'tags', 'song_tags', 'user_tag_preferences')
    `, [dbConfig.database]);

    const existingTables = tables.map(row => row.TABLE_NAME);

    if (!existingTables.includes('tag_categories')) {
      console.log('    → Creating tags system tables...');

      // Create tag_categories table
      await connection.execute(`
        CREATE TABLE tag_categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(50) NOT NULL UNIQUE,
          description TEXT,
          color VARCHAR(7) DEFAULT '#1DB954',
          is_system BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Insert default system categories
      await connection.execute(`
        INSERT INTO tag_categories (name, description, color, is_system) VALUES
        ('genre', 'Music genre categories', '#1DB954', TRUE),
        ('mood', 'Emotional mood and atmosphere', '#FF6B6B', TRUE),
        ('instrument', 'Musical instruments featured', '#4ECDC4', TRUE),
        ('era', 'Time period or decade', '#45B7D1', TRUE),
        ('language', 'Primary language of lyrics', '#96CEB4', TRUE),
        ('custom', 'User-defined custom tags', '#FFEAA7', TRUE)
      `);

      // Create tags table
      await connection.execute(`
        CREATE TABLE tags (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          category_id INT NOT NULL,
          description TEXT,
          usage_count INT DEFAULT 0,
          is_approved BOOLEAN DEFAULT TRUE,
          created_by VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES tag_categories(id) ON DELETE CASCADE,
          UNIQUE KEY unique_tag_name_category (name, category_id),
          INDEX idx_tags_category (category_id),
          INDEX idx_tags_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Insert default tags
      await connection.execute(`
        INSERT INTO tags (name, category_id, description, is_approved) VALUES
        ('Pop', (SELECT id FROM tag_categories WHERE name = 'genre'), 'Popular music', TRUE),
        ('Rock', (SELECT id FROM tag_categories WHERE name = 'genre'), 'Rock music', TRUE),
        ('Hip Hop', (SELECT id FROM tag_categories WHERE name = 'genre'), 'Hip hop and rap', TRUE),
        ('Electronic', (SELECT id FROM tag_categories WHERE name = 'genre'), 'Electronic dance music', TRUE),
        ('Jazz', (SELECT id FROM tag_categories WHERE name = 'genre'), 'Jazz music', TRUE),
        ('Classical', (SELECT id FROM tag_categories WHERE name = 'genre'), 'Classical music', TRUE),
        ('Country', (SELECT id FROM tag_categories WHERE name = 'genre'), 'Country music', TRUE),
        ('R&B', (SELECT id FROM tag_categories WHERE name = 'genre'), 'Rhythm and blues', TRUE),
        ('Happy', (SELECT id FROM tag_categories WHERE name = 'mood'), 'Uplifting and joyful', TRUE),
        ('Sad', (SELECT id FROM tag_categories WHERE name = 'mood'), 'Melancholic and emotional', TRUE),
        ('Energetic', (SELECT id FROM tag_categories WHERE name = 'mood'), 'High energy and upbeat', TRUE),
        ('Calm', (SELECT id FROM tag_categories WHERE name = 'mood'), 'Relaxing and peaceful', TRUE),
        ('Romantic', (SELECT id FROM tag_categories WHERE name = 'mood'), 'Love and romance themes', TRUE),
        ('Angry', (SELECT id FROM tag_categories WHERE name = 'mood'), 'Intense and aggressive', TRUE),
        ('Guitar', (SELECT id FROM tag_categories WHERE name = 'instrument'), 'Guitar featured prominently', TRUE),
        ('Piano', (SELECT id FROM tag_categories WHERE name = 'instrument'), 'Piano or keyboard featured', TRUE),
        ('Drums', (SELECT id FROM tag_categories WHERE name = 'instrument'), 'Drums or percussion featured', TRUE),
        ('Violin', (SELECT id FROM tag_categories WHERE name = 'instrument'), 'Violin or strings featured', TRUE),
        ('Synth', (SELECT id FROM tag_categories WHERE name = 'instrument'), 'Synthesizer featured', TRUE),
        ('80s', (SELECT id FROM tag_categories WHERE name = 'era'), '1980s music style', TRUE),
        ('90s', (SELECT id FROM tag_categories WHERE name = 'era'), '1990s music style', TRUE),
        ('2000s', (SELECT id FROM tag_categories WHERE name = 'era'), '2000s music style', TRUE),
        ('2010s', (SELECT id FROM tag_categories WHERE name = 'era'), '2010s music style', TRUE),
        ('2020s', (SELECT id FROM tag_categories WHERE name = 'era'), '2020s music style', TRUE),
        ('English', (SELECT id FROM tag_categories WHERE name = 'language'), 'English lyrics', TRUE),
        ('Spanish', (SELECT id FROM tag_categories WHERE name = 'language'), 'Spanish lyrics', TRUE),
        ('French', (SELECT id FROM tag_categories WHERE name = 'language'), 'French lyrics', TRUE),
        ('German', (SELECT id FROM tag_categories WHERE name = 'language'), 'German lyrics', TRUE),
        ('Instrumental', (SELECT id FROM tag_categories WHERE name = 'language'), 'No lyrics/instrumental', TRUE)
      `);

      // Create song_tags table
      await connection.execute(`
        CREATE TABLE song_tags (
          id INT AUTO_INCREMENT PRIMARY KEY,
          song_id VARCHAR(255) NOT NULL,
          tag_id INT NOT NULL,
          added_by VARCHAR(255),
          added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          confidence_score DECIMAL(3,2) DEFAULT 1.0,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
          UNIQUE KEY unique_song_tag (song_id, tag_id),
          INDEX idx_song_tags_song_id (song_id),
          INDEX idx_song_tags_tag_id (tag_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Create user_tag_preferences table
      await connection.execute(`
        CREATE TABLE user_tag_preferences (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          tag_id INT NOT NULL,
          preference_score DECIMAL(3,2) DEFAULT 0.0,
          interaction_count INT DEFAULT 1,
          last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_tag (user_id, tag_id),
          INDEX idx_user_tag_preferences_user (user_id),
          INDEX idx_user_tag_preferences_score (preference_score DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      console.log('    ✓ Tags system tables created successfully');
    } else {
      console.log('    ✓ Tags system tables already exist');
    }

  } catch (error) {
    console.error('    ✗ Error in tags system migration:', error);
    // Don't throw - let the app continue even if migration fails
  }
}

// Automatic migration function
async function runMigrations(connection) {
  try {
    console.log('Checking for database migrations...');

    // Check if type and file_name columns exist in translation_history
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'translation_history'
      AND COLUMN_NAME IN ('type', 'file_name')
    `, [dbConfig.database]);

    // Add type column if it doesn't exist
    if (!columns.some(col => col.COLUMN_NAME === 'type')) {
      console.log('  → Adding type column to translation_history...');
      await connection.execute(`
        ALTER TABLE translation_history
        ADD COLUMN type ENUM('text', 'file') DEFAULT 'text' NOT NULL AFTER target_language
      `);
      console.log('  ✓ Added type column');
    }

    // Add file_name column if it doesn't exist
    if (!columns.some(col => col.COLUMN_NAME === 'file_name')) {
      console.log('  → Adding file_name column to translation_history...');
      await connection.execute(`
        ALTER TABLE translation_history
        ADD COLUMN file_name VARCHAR(255) NULL AFTER type
      `);
      console.log('  ✓ Added file_name column');
    }

    // Run song enhancements migration
    await runSongEnhancementsMigration(connection);

    // Run tags system migration
    await runTagsMigration(connection);

    // Run users table migration for admin functionality
    await runUsersTableMigration(connection);

    if (columns.length === 2) {
      console.log('  ✓ All migrations up to date');
    } else {
      console.log('  ✓ Migrations completed successfully');
    }
  } catch (error) {
    console.error('  ✗ Error running migrations:', error);
    // Don't throw - let the app continue even if migration fails
  }
}

// Save translation to history
export async function saveTranslation(userId, sourceText, translatedText, sourceLang, targetLang, type = 'text', fileName = null) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO translation_history (user_id, source_text, translated_text, source_language, target_language, type, file_name) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, sourceText, translatedText, sourceLang, targetLang, type, fileName]
    );
    
    // Keep only last 10 translations for this user (increased from 5)
    await pool.execute(
      `DELETE FROM translation_history 
       WHERE user_id = ? 
       AND id NOT IN (
         SELECT id FROM (
           SELECT id FROM translation_history 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT 10
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
       LIMIT 10`,
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching translation history:', error);
    throw error;
  }
}

// Save chat to history
export async function saveChat(userId, userMessage, assistantMessage, model) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO chat_history (user_id, user_message, assistant_message, model) 
       VALUES (?, ?, ?, ?)`,
      [userId, userMessage, assistantMessage, model]
    );
    
    // Keep only last 10 chat exchanges for this user
    await pool.execute(
      `DELETE FROM chat_history 
       WHERE user_id = ? 
       AND id NOT IN (
         SELECT id FROM (
           SELECT id FROM chat_history 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT 10
         ) AS keep_records
       )`,
      [userId, userId]
    );
    
    return result.insertId;
  } catch (error) {
    console.error('Error saving chat:', error);
    throw error;
  }
}

// Get chat history for user
export async function getChatHistory(userId) {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM chat_history 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
}

// Save chat session
export async function saveChatSession(userId, sessionId, sessionName, messages, model) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO chat_sessions (user_id, session_id, session_name, messages, model) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       session_name = VALUES(session_name),
       messages = VALUES(messages),
       model = VALUES(model),
       updated_at = CURRENT_TIMESTAMP`,
      [userId, sessionId, sessionName, messages, model]
    );
    return sessionId;
  } catch (error) {
    console.error('Error saving chat session:', error);
    throw error;
  }
}

// Get chat sessions for user
export async function getChatSessions(userId) {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM chat_sessions 
       WHERE user_id = ? 
       ORDER BY updated_at DESC 
       LIMIT 50`,
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    throw error;
  }
}

// Delete chat session
export async function deleteChatSession(userId, sessionId) {
  try {
    const [result] = await pool.execute(
      `DELETE FROM chat_sessions 
       WHERE user_id = ? AND session_id = ?`,
      [userId, sessionId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting chat session:', error);
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

// Users table migration function for admin functionality
async function runUsersTableMigration(connection) {
  try {
    console.log('  → Checking users table migration for admin functionality...');

    // Check if users table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'users'
    `, [dbConfig.database]);

    if (tables.length === 0) {
      console.log('    → Users table does not exist, skipping migration');
      return;
    }

    // Check existing columns in users table
    const [existingColumns] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'users'
    `, [dbConfig.database]);

    const columnNames = existingColumns.map(col => col.COLUMN_NAME);

    console.log('    → Existing users table columns:', columnNames.join(', '));

    // Columns to add for admin functionality
    const columnsToAdd = [
      { name: 'username', sql: 'ALTER TABLE users ADD COLUMN username VARCHAR(255) NULL AFTER clerk_id' },
      { name: 'first_name', sql: 'ALTER TABLE users ADD COLUMN first_name VARCHAR(255) NULL AFTER email' },
      { name: 'last_name', sql: 'ALTER TABLE users ADD COLUMN last_name VARCHAR(255) NULL AFTER first_name' },
      { name: 'role', sql: "ALTER TABLE users ADD COLUMN role ENUM('user', 'artist', 'admin') DEFAULT 'user' AFTER last_name" },
      { name: 'status', sql: "ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive', 'banned', 'suspended') DEFAULT 'active' AFTER role" },
      { name: 'last_active_at', sql: 'ALTER TABLE users ADD COLUMN last_active_at TIMESTAMP NULL AFTER updated_at' }
    ];

    let columnsAdded = 0;
    for (const col of columnsToAdd) {
      if (!columnNames.includes(col.name)) {
        console.log('      → Adding column:', col.name);
        await connection.execute(col.sql);
        columnsAdded++;
      }
    }

    // Create indexes for new columns
    const indexesToCreate = [
      'CREATE INDEX idx_username ON users(username)',
      'CREATE INDEX idx_role ON users(role)',
      'CREATE INDEX idx_status ON users(status)',
      'CREATE INDEX idx_last_active_at ON users(last_active_at)'
    ];

    for (const indexSQL of indexesToCreate) {
      try {
        await connection.execute(indexSQL);
        console.log('      → Created index');
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          // Index already exists, skip
        } else {
          throw error;
        }
      }
    }

    // Update existing records to populate new columns
    if (columnsAdded > 0) {
      console.log('      → Updating existing records...');
      await connection.execute('UPDATE users SET username = clerk_id WHERE username IS NULL OR username = ""');
      await connection.execute("UPDATE users SET role = 'user' WHERE role IS NULL OR role = ''");
      await connection.execute("UPDATE users SET status = 'active' WHERE status IS NULL OR status = ''");
      await connection.execute('UPDATE users SET last_active_at = last_login WHERE last_active_at IS NULL AND last_login IS NOT NULL');
      await connection.execute('UPDATE users SET last_active_at = created_at WHERE last_active_at IS NULL');
    }

    if (columnsAdded > 0) {
      console.log('    ✓ Users table migration completed successfully');
    } else {
      console.log('    ✓ Users table already up to date');
    }

  } catch (error) {
    console.error('    ✗ Error in users table migration:', error);
    // Don't throw - let the app continue even if migration fails
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