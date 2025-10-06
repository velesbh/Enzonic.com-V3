/**
 * Database Utility Functions
 * Reusable helper functions for common database operations
 */
import pool from '../database/config.js';

/**
 * Generic CRUD Operations
 */

// CREATE: Insert data into any table
export async function createRecord(table, data, userIdField = 'user_id') {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const placeholders = fields.map(() => '?').join(', ');
  
  const query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
  const [result] = await pool.execute(query, values);
  
  return result.insertId;
}

// READ: Get records with optional filtering
export async function getRecords(table, filters = {}, options = {}) {
  const { limit = 10, offset = 0, orderBy = 'created_at', orderDir = 'DESC' } = options;
  
  let query = `SELECT * FROM ${table}`;
  const params = [];
  
  if (Object.keys(filters).length > 0) {
    const conditions = Object.keys(filters).map(key => `${key} = ?`).join(' AND ');
    query += ` WHERE ${conditions}`;
    params.push(...Object.values(filters));
  }
  
  query += ` ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const [rows] = await pool.execute(query, params);
  return rows;
}

// UPDATE: Update records with conditions
export async function updateRecord(table, id, data, userIdField = 'user_id', userId = null) {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const setClause = fields.map(field => `${field} = ?`).join(', ');
  
  let query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
  const params = [...values, id];
  
  if (userId && userIdField) {
    query += ` AND ${userIdField} = ?`;
    params.push(userId);
  }
  
  const [result] = await pool.execute(query, params);
  return result.affectedRows > 0;
}

// DELETE: Delete records with conditions
export async function deleteRecord(table, id, userIdField = 'user_id', userId = null) {
  let query = `DELETE FROM ${table} WHERE id = ?`;
  const params = [id];
  
  if (userId && userIdField) {
    query += ` AND ${userIdField} = ?`;
    params.push(userId);
  }
  
  const [result] = await pool.execute(query, params);
  return result.affectedRows > 0;
}

/**
 * Advanced Query Helpers
 */

// Search with full-text search
export async function searchRecords(table, searchFields, searchTerm, filters = {}, options = {}) {
  const { limit = 10, offset = 0 } = options;
  
  let query = `SELECT * FROM ${table}`;
  const params = [];
  
  // Build search conditions
  const searchConditions = searchFields.map(field => `${field} LIKE ?`).join(' OR ');
  const searchParams = searchFields.map(() => `%${searchTerm}%`);
  
  // Combine search with filters
  const conditions = [];
  if (searchTerm) {
    conditions.push(`(${searchConditions})`);
    params.push(...searchParams);
  }
  
  if (Object.keys(filters).length > 0) {
    const filterConditions = Object.keys(filters).map(key => `${key} = ?`).join(' AND ');
    conditions.push(filterConditions);
    params.push(...Object.values(filters));
  }
  
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const [rows] = await pool.execute(query, params);
  return rows;
}

// Get count of records
export async function countRecords(table, filters = {}) {
  let query = `SELECT COUNT(*) as total FROM ${table}`;
  const params = [];
  
  if (Object.keys(filters).length > 0) {
    const conditions = Object.keys(filters).map(key => `${key} = ?`).join(' AND ');
    query += ` WHERE ${conditions}`;
    params.push(...Object.values(filters));
  }
  
  const [result] = await pool.execute(query, params);
  return result[0].total;
}

// Batch operations
export async function batchInsert(table, records) {
  if (records.length === 0) return [];
  
  const fields = Object.keys(records[0]);
  const placeholders = fields.map(() => '?').join(', ');
  const valuesClause = records.map(() => `(${placeholders})`).join(', ');
  
  const query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES ${valuesClause}`;
  const params = records.flatMap(record => Object.values(record));
  
  const [result] = await pool.execute(query, params);
  return result;
}

/**
 * User-specific operations
 */

// Get user's records with pagination
export async function getUserRecords(table, userId, options = {}) {
  return getRecords(table, { user_id: userId }, options);
}

// Clean up old user records (keep only N most recent)
export async function cleanupUserRecords(table, userId, keepCount = 5) {
  const query = `
    DELETE FROM ${table} 
    WHERE user_id = ? 
    AND id NOT IN (
      SELECT id FROM (
        SELECT id FROM ${table} 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      ) AS keep_records
    )
  `;
  
  const [result] = await pool.execute(query, [userId, userId, keepCount]);
  return result.affectedRows;
}

/**
 * JSON field helpers (for storing complex data)
 */

// Save JSON data
export async function saveUserJSON(table, userId, jsonData, additionalFields = {}) {
  const data = {
    user_id: userId,
    data: JSON.stringify(jsonData),
    ...additionalFields
  };
  
  return createRecord(table, data);
}

// Get and parse JSON data
export async function getUserJSON(table, userId, options = {}) {
  const records = await getUserRecords(table, userId, options);
  
  return records.map(record => ({
    ...record,
    data: JSON.parse(record.data)
  }));
}

/**
 * Database health and maintenance
 */

// Check database connection
export async function checkDatabaseHealth() {
  try {
    const [result] = await pool.execute('SELECT 1 as health');
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date() };
  }
}

// Create table helper
export async function createTable(tableName, schema) {
  const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${schema})`;
  await pool.execute(query);
}

// Example schemas for common patterns
export const commonSchemas = {
  userPreferences: `
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    preferences JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
  `,
  
  userFiles: `
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    size INT NOT NULL,
    mimetype VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_filename (filename)
  `,
  
  userActivity: `
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
  `,
  
  userNotes: `
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags JSON,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_search (title, content)
  `
};

export default {
  createRecord,
  getRecords,
  updateRecord,
  deleteRecord,
  searchRecords,
  countRecords,
  batchInsert,
  getUserRecords,
  cleanupUserRecords,
  saveUserJSON,
  getUserJSON,
  checkDatabaseHealth,
  createTable,
  commonSchemas
};