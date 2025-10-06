# Backend Utilities

This directory contains reusable utility functions and generators for building features quickly and consistently.

## 📁 Files Overview

### `database.js`
Common database operations and helpers:
- CRUD operations for any table
- User-specific data queries
- JSON field handling
- Pagination and search
- Database health checks
- Pre-built schemas for common patterns

### `validation.js`
Input validation and sanitization:
- Basic validators (email, phone, URL, etc.)
- Schema validation
- Express middleware for validation
- File upload validation
- Data sanitization helpers

### `response.js`
Standardized API response helpers:
- Success/error responses
- Pagination responses
- File responses
- Cache headers
- CORS handling
- Error handling middleware

### `generate-feature.js`
Feature scaffolding tool:
- Generate complete CRUD features
- Create controllers, routes, models
- Generate frontend API services
- Auto-generate integration docs

## 🚀 Quick Start Examples

### Generate a New Feature
```bash
cd backend/utils
node generate-feature.js UserProfile
```

This creates:
- Controller with CRUD operations
- Routes with validation
- Database model
- Frontend API service
- Integration instructions

### Use Database Utilities
```javascript
import { createRecord, getUserRecords } from '../utils/database.js';

// Save user data
const id = await createRecord('user_notes', {
  user_id: userId,
  title: 'My Note',
  content: 'Note content'
});

// Get user's data
const notes = await getUserRecords('user_notes', userId, { limit: 10 });
```

### Use Validation Middleware
```javascript
import { validateBody } from '../utils/validation.js';

const noteSchema = {
  title: (value) => validateString(value, { required: true, maxLength: 255 }),
  content: (value) => validateString(value, { required: true })
};

router.post('/notes', validateBody(noteSchema), createNoteController);
```

### Use Response Helpers
```javascript
import { responseHelpers } from '../utils/response.js';

// Add to your server
app.use(responseHelpers);

// In controllers
export function createNote(req, res) {
  // ... logic
  res.success({ id: noteId }, 'Note created successfully', 201);
}
```

## 🎯 Common Patterns

### User-Specific CRUD API
1. Generate feature: `node generate-feature.js Note`
2. Customize validation in routes
3. Add to server.js: `app.use('/api/notes', noteRoutes)`
4. Use frontend service in React components

### File Upload Feature
```javascript
// Backend route
import multer from 'multer';
import { validateFileUpload } from '../utils/validation.js';

const upload = multer({ dest: 'uploads/' });

router.post('/upload', 
  upload.single('file'),
  validateFileUpload({ 
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png'] 
  }),
  uploadController
);
```

### Paginated Data API
```javascript
// Backend controller
import { getUserRecords, countRecords } from '../utils/database.js';

export async function getNotesController(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const [data, total] = await Promise.all([
    getUserRecords('notes', req.userId, { page, limit }),
    countRecords('notes', { user_id: req.userId })
  ]);
  
  res.paginated(data, { page, limit, total });
}
```

### Search Feature
```javascript
import { searchRecords } from '../utils/database.js';

export async function searchNotesController(req, res) {
  const { q } = req.query;
  const results = await searchRecords(
    'notes', 
    ['title', 'content'], 
    q, 
    { user_id: req.userId }
  );
  
  res.success(results);
}
```

## 🔧 Customization

### Add Custom Validators
```javascript
// In validation.js or your custom file
export function validateCategory(value) {
  const allowedCategories = ['work', 'personal', 'ideas'];
  
  if (!allowedCategories.includes(value)) {
    return { valid: false, error: 'Invalid category' };
  }
  
  return { valid: true };
}
```

### Add Custom Database Operations
```javascript
// In database.js or your custom file
export async function getPopularContent(limit = 10) {
  const [rows] = await pool.execute(`
    SELECT *, COUNT(views) as view_count 
    FROM content 
    GROUP BY id 
    ORDER BY view_count DESC 
    LIMIT ?
  `, [limit]);
  
  return rows;
}
```

### Add Custom Response Types
```javascript
// In response.js or your custom file
export function analyticsResponse(res, data, timeframe) {
  return res.json({
    success: true,
    analytics: data,
    timeframe,
    generated_at: new Date().toISOString()
  });
}
```

## 📋 Best Practices

1. **Always validate input** - Use validation middleware on all routes
2. **User isolation** - Include user_id in all user-specific queries
3. **Consistent responses** - Use response helpers for standardized output
4. **Error handling** - Use the error handler middleware
5. **Database cleanup** - Use cleanup functions for limited storage
6. **Security** - Sanitize input and validate permissions

## 🔒 Security Notes

- All database operations include user isolation by default
- Validation helpers prevent common injection attacks
- File upload validation includes type and size restrictions
- Response helpers prevent information leakage
- Authentication middleware required for protected routes

This utility collection provides everything you need to build secure, scalable API features quickly! 🚀