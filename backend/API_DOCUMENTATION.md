# Backend API Documentation

This backend provides reusable functions and patterns for building secure, database-integrated APIs with Clerk authentication.

## 🏗️ Architecture Overview

```
backend/
├── server.js              # Main server entry point
├── database/
│   └── config.js          # Database connection & utilities
├── middleware/
│   └── auth.js            # Clerk authentication middleware
├── controllers/
│   └── translationController.js  # Business logic
└── routes/
    └── translations.js    # Route definitions
```

## 🔧 Reusable Components

### 1. Database Configuration (`database/config.js`)

#### Connection Pool
```javascript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
```

#### Reusable Database Functions

**Initialize Database with Custom Tables:**
```javascript
export async function initializeDatabase() {
  const connection = await pool.getConnection();
  
  // Create your custom table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS your_table (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      your_data TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id)
    )
  `);
  
  connection.release();
}
```

**Generic Save Function:**
```javascript
export async function saveUserData(userId, data) {
  const [result] = await pool.execute(
    'INSERT INTO your_table (user_id, your_data) VALUES (?, ?)',
    [userId, JSON.stringify(data)]
  );
  return result.insertId;
}
```

**Generic Fetch Function:**
```javascript
export async function getUserData(userId, limit = 10) {
  const [rows] = await pool.execute(
    'SELECT * FROM your_table WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    [userId, limit]
  );
  return rows;
}
```

**Generic Update Function:**
```javascript
export async function updateUserData(id, userId, data) {
  const [result] = await pool.execute(
    'UPDATE your_table SET your_data = ? WHERE id = ? AND user_id = ?',
    [JSON.stringify(data), id, userId]
  );
  return result.affectedRows > 0;
}
```

**Generic Delete Function:**
```javascript
export async function deleteUserData(id, userId) {
  const [result] = await pool.execute(
    'DELETE FROM your_table WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
}
```

### 2. Authentication Middleware (`middleware/auth.js`)

**Clerk Token Verification:**
```javascript
import { clerkClient } from '@clerk/clerk-sdk-node';

export async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const token = authHeader.substring(7);
    const sessionClaims = await clerkClient.verifyToken(token);
    
    if (!sessionClaims || !sessionClaims.sub) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.userId = sessionClaims.sub;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}
```

**Optional Authentication (for public/private hybrid endpoints):**
```javascript
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const sessionClaims = await clerkClient.verifyToken(token);
      req.userId = sessionClaims?.sub || null;
    } else {
      req.userId = null;
    }
    
    next();
  } catch (error) {
    req.userId = null;
    next();
  }
}
```

### 3. Controller Pattern (`controllers/`)

**Generic Controller Template:**
```javascript
import { saveUserData, getUserData, updateUserData, deleteUserData } from '../database/config.js';

// CREATE
export async function createDataController(req, res) {
  try {
    const { data } = req.body;
    const userId = req.userId;
    
    if (!data) {
      return res.status(400).json({ error: 'Missing required data' });
    }
    
    const dataId = await saveUserData(userId, data);
    
    res.json({ 
      success: true, 
      dataId,
      message: 'Data saved successfully' 
    });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
}

// READ
export async function getDataController(req, res) {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 10;
    
    const data = await getUserData(userId, limit);
    
    res.json({ 
      success: true, 
      data: data.map(item => ({
        id: item.id,
        data: JSON.parse(item.your_data),
        createdAt: item.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}

// UPDATE
export async function updateDataController(req, res) {
  try {
    const { id } = req.params;
    const { data } = req.body;
    const userId = req.userId;
    
    const success = await updateUserData(id, userId, data);
    
    if (!success) {
      return res.status(404).json({ error: 'Data not found or unauthorized' });
    }
    
    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ error: 'Failed to update data' });
  }
}

// DELETE
export async function deleteDataController(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const success = await deleteUserData(id, userId);
    
    if (!success) {
      return res.status(404).json({ error: 'Data not found or unauthorized' });
    }
    
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  }
}
```

### 4. Route Pattern (`routes/`)

**Generic CRUD Routes:**
```javascript
import express from 'express';
import { authenticateUser, optionalAuth } from '../middleware/auth.js';
import { 
  createDataController, 
  getDataController, 
  updateDataController, 
  deleteDataController 
} from '../controllers/yourController.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/public', getDataController);

// Protected routes (auth required)
router.use(authenticateUser);

router.post('/', createDataController);           // CREATE
router.get('/', getDataController);               // READ
router.put('/:id', updateDataController);         // UPDATE
router.delete('/:id', deleteDataController);     // DELETE

export default router;
```

## 🚀 Usage Examples

### Example 1: User Preferences API

**Create `controllers/preferencesController.js`:**
```javascript
import { saveUserData, getUserData, updateUserData } from '../database/config.js';

export async function savePreferences(req, res) {
  try {
    const { theme, language, notifications } = req.body;
    const userId = req.userId;
    
    const preferences = { theme, language, notifications };
    const prefId = await saveUserData(userId, preferences);
    
    res.json({ success: true, prefId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save preferences' });
  }
}

export async function getPreferences(req, res) {
  try {
    const userId = req.userId;
    const prefs = await getUserData(userId, 1);
    
    res.json({ 
      success: true, 
      preferences: prefs[0] ? JSON.parse(prefs[0].your_data) : null 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
}
```

**Create `routes/preferences.js`:**
```javascript
import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { savePreferences, getPreferences } from '../controllers/preferencesController.js';

const router = express.Router();
router.use(authenticateUser);

router.post('/', savePreferences);
router.get('/', getPreferences);

export default router;
```

### Example 2: File Upload API

**Create `controllers/uploadController.js`:**
```javascript
import multer from 'multer';
import path from 'path';
import { saveUserData } from '../database/config.js';

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

export const upload = multer({ storage });

export async function uploadFile(req, res) {
  try {
    const userId = req.userId;
    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    };
    
    const fileId = await saveUserData(userId, fileData);
    
    res.json({ 
      success: true, 
      fileId,
      filename: req.file.filename 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload file' });
  }
}
```

## 🔒 Security Best Practices

### 1. Input Validation
```javascript
import Joi from 'joi';

const schema = Joi.object({
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0).max(150)
});

export function validateInput(req, res, next) {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
}
```

### 2. Rate Limiting
```javascript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});
```

### 3. Error Handling
```javascript
export function errorHandler(error, req, res, next) {
  console.error('Unhandled error:', error);
  
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Resource already exists' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
}
```

## 🔄 Integration with Frontend

**Frontend API Service Template:**
```javascript
import { env } from './env';

async function getAuthToken() {
  const { getToken } = await import('@clerk/clerk-react');
  return await getToken();
}

export async function apiCall(endpoint, options = {}) {
  const token = await getAuthToken();
  
  const response = await fetch(`${env.API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}

// Usage examples:
export const saveUserPreferences = (data) => 
  apiCall('/api/preferences', { method: 'POST', body: JSON.stringify(data) });

export const getUserPreferences = () => 
  apiCall('/api/preferences');
```

## 📊 Database Patterns

### 1. Pagination
```javascript
export async function getPaginatedData(userId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  
  const [rows] = await pool.execute(
    `SELECT * FROM your_table 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  
  const [countResult] = await pool.execute(
    'SELECT COUNT(*) as total FROM your_table WHERE user_id = ?',
    [userId]
  );
  
  return {
    data: rows,
    total: countResult[0].total,
    page,
    totalPages: Math.ceil(countResult[0].total / limit)
  };
}
```

### 2. Search & Filtering
```javascript
export async function searchUserData(userId, searchTerm, filters = {}) {
  let query = 'SELECT * FROM your_table WHERE user_id = ?';
  const params = [userId];
  
  if (searchTerm) {
    query += ' AND (your_data LIKE ? OR title LIKE ?)';
    params.push(`%${searchTerm}%`, `%${searchTerm}%`);
  }
  
  if (filters.category) {
    query += ' AND category = ?';
    params.push(filters.category);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const [rows] = await pool.execute(query, params);
  return rows;
}
```

This documentation provides all the reusable patterns you need to build new features quickly and securely! 🚀