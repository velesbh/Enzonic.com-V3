#!/usr/bin/env node

/**
 * Feature Generator Script
 * Quickly scaffold new API features using the reusable backend patterns
 */

import fs from 'fs';
import path from 'path';

// Templates for different feature types
const templates = {
  controller: (featureName, tableName) => `import { 
  createRecord, 
  getRecords, 
  updateRecord, 
  deleteRecord, 
  getUserRecords,
  countRecords 
} from '../utils/database.js';
import { validateSchema, commonValidators } from '../utils/validation.js';

// CREATE - Save new ${featureName}
export async function create${featureName}Controller(req, res) {
  try {
    const userId = req.userId;
    const data = req.body;
    
    // Add user_id to the data
    data.user_id = userId;
    
    const ${featureName.toLowerCase()}Id = await createRecord('${tableName}', data);
    
    res.success({ 
      id: ${featureName.toLowerCase()}Id 
    }, '${featureName} created successfully', 201);
  } catch (error) {
    console.error('Error creating ${featureName.toLowerCase()}:', error);
    res.error('Failed to create ${featureName.toLowerCase()}');
  }
}

// READ - Get user's ${featureName}s
export async function get${featureName}sController(req, res) {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      getUserRecords('${tableName}', userId, { limit, offset }),
      countRecords('${tableName}', { user_id: userId })
    ]);
    
    res.paginated(data, { page, limit, total });
  } catch (error) {
    console.error('Error fetching ${featureName.toLowerCase()}s:', error);
    res.error('Failed to fetch ${featureName.toLowerCase()}s');
  }
}

// READ - Get single ${featureName}
export async function get${featureName}Controller(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const data = await getRecords('${tableName}', { id, user_id: userId }, { limit: 1 });
    
    if (data.length === 0) {
      return res.notFound('${featureName} not found');
    }
    
    res.success(data[0]);
  } catch (error) {
    console.error('Error fetching ${featureName.toLowerCase()}:', error);
    res.error('Failed to fetch ${featureName.toLowerCase()}');
  }
}

// UPDATE - Update ${featureName}
export async function update${featureName}Controller(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const data = req.body;
    
    const success = await updateRecord('${tableName}', id, data, 'user_id', userId);
    
    if (!success) {
      return res.notFound('${featureName} not found or access denied');
    }
    
    res.success(null, '${featureName} updated successfully');
  } catch (error) {
    console.error('Error updating ${featureName.toLowerCase()}:', error);
    res.error('Failed to update ${featureName.toLowerCase()}');
  }
}

// DELETE - Delete ${featureName}
export async function delete${featureName}Controller(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const success = await deleteRecord('${tableName}', id, 'user_id', userId);
    
    if (!success) {
      return res.notFound('${featureName} not found or access denied');
    }
    
    res.success(null, '${featureName} deleted successfully');
  } catch (error) {
    console.error('Error deleting ${featureName.toLowerCase()}:', error);
    res.error('Failed to delete ${featureName.toLowerCase()}');
  }
}`,

  routes: (featureName) => `import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { validateBody, validateParams } from '../utils/validation.js';
import { 
  create${featureName}Controller,
  get${featureName}sController,
  get${featureName}Controller,
  update${featureName}Controller,
  delete${featureName}Controller
} from '../controllers/${featureName.toLowerCase()}Controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Validation schemas
const create${featureName}Schema = {
  // Add your validation rules here
  // title: (value) => validateString(value, { required: true, maxLength: 255 }),
  // content: (value) => validateString(value, { required: true, maxLength: 10000 })
};

const update${featureName}Schema = {
  // Add your validation rules here (usually same as create but optional)
};

const idParamSchema = {
  id: (value) => {
    const num = parseInt(value);
    if (isNaN(num) || num <= 0) {
      return { valid: false, error: 'ID must be a positive integer' };
    }
    return { valid: true };
  }
};

// Routes
router.post('/', 
  validateBody(create${featureName}Schema), 
  create${featureName}Controller
);

router.get('/', 
  get${featureName}sController
);

router.get('/:id', 
  validateParams(idParamSchema), 
  get${featureName}Controller
);

router.put('/:id', 
  validateParams(idParamSchema),
  validateBody(update${featureName}Schema), 
  update${featureName}Controller
);

router.delete('/:id', 
  validateParams(idParamSchema), 
  delete${featureName}Controller
);

export default router;`,

  model: (featureName, tableName, fields) => `/**
 * ${featureName} Database Model
 * Database schema and operations for ${featureName.toLowerCase()}s
 */

import { createTable, commonSchemas } from '../utils/database.js';

// Table schema
export const ${featureName.toLowerCase()}Schema = \`
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  ${fields.map(field => `${field.name} ${field.type} ${field.required ? 'NOT NULL' : ''}`).join(',\n  ')},
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
\`;

// Initialize table
export async function initialize${featureName}Table() {
  await createTable('${tableName}', ${featureName.toLowerCase()}Schema);
  console.log('${featureName} table initialized');
}`,

  frontend: (featureName) => `/**
 * ${featureName} API Service
 * Frontend service for ${featureName.toLowerCase()} operations
 */

import { env } from './env';

async function getAuthToken() {
  const { getToken } = await import('@clerk/clerk-react');
  return await getToken();
}

async function apiCall(endpoint, options = {}) {
  const token = await getAuthToken();
  
  const response = await fetch(\`\${env.API_URL}\${endpoint}\`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': \`Bearer \${token}\` }),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(\`API Error: \${response.statusText}\`);
  }
  
  return response.json();
}

// ${featureName} API functions
export const ${featureName.toLowerCase()}Api = {
  // Create new ${featureName.toLowerCase()}
  create: (data) => 
    apiCall('/api/${featureName.toLowerCase()}s', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  
  // Get all ${featureName.toLowerCase()}s
  getAll: (page = 1, limit = 10) => 
    apiCall(\`/api/${featureName.toLowerCase()}s?page=\${page}&limit=\${limit}\`),
  
  // Get single ${featureName.toLowerCase()}
  getById: (id) => 
    apiCall(\`/api/${featureName.toLowerCase()}s/\${id}\`),
  
  // Update ${featureName.toLowerCase()}
  update: (id, data) => 
    apiCall(\`/api/${featureName.toLowerCase()}s/\${id}\`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
  
  // Delete ${featureName.toLowerCase()}
  delete: (id) => 
    apiCall(\`/api/${featureName.toLowerCase()}s/\${id}\`, { 
      method: 'DELETE' 
    })
};

export default ${featureName.toLowerCase()}Api;`
};

// Field types for schema generation
const fieldTypes = {
  string: 'VARCHAR(255)',
  text: 'TEXT',
  number: 'INT',
  decimal: 'DECIMAL(10,2)',
  boolean: 'BOOLEAN',
  date: 'DATE',
  datetime: 'DATETIME',
  timestamp: 'TIMESTAMP',
  json: 'JSON'
};

/**
 * Generate a new feature
 */
export function generateFeature(config) {
  const { 
    featureName, 
    tableName = featureName.toLowerCase() + 's',
    fields = [],
    outputDir = './generated'
  } = config;
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate controller
  const controllerContent = templates.controller(featureName, tableName);
  fs.writeFileSync(
    path.join(outputDir, `${featureName.toLowerCase()}Controller.js`), 
    controllerContent
  );
  
  // Generate routes
  const routesContent = templates.routes(featureName);
  fs.writeFileSync(
    path.join(outputDir, `${featureName.toLowerCase()}Routes.js`), 
    routesContent
  );
  
  // Generate model
  const modelContent = templates.model(featureName, tableName, fields);
  fs.writeFileSync(
    path.join(outputDir, `${featureName.toLowerCase()}Model.js`), 
    modelContent
  );
  
  // Generate frontend service
  const frontendContent = templates.frontend(featureName);
  fs.writeFileSync(
    path.join(outputDir, `${featureName.toLowerCase()}Api.js`), 
    frontendContent
  );
  
  // Generate integration instructions
  const integrationInstructions = `
# Integration Instructions for ${featureName}

## Backend Integration

1. Copy the generated files to their respective directories:
   - \`${featureName.toLowerCase()}Controller.js\` → \`backend/controllers/\`
   - \`${featureName.toLowerCase()}Routes.js\` → \`backend/routes/\`
   - \`${featureName.toLowerCase()}Model.js\` → \`backend/models/\`

2. Add the routes to your main server file (\`server.js\`):
   \`\`\`javascript
   import ${featureName.toLowerCase()}Routes from './routes/${featureName.toLowerCase()}Routes.js';
   app.use('/api/${featureName.toLowerCase()}s', ${featureName.toLowerCase()}Routes);
   \`\`\`

3. Initialize the database table in your \`database/config.js\`:
   \`\`\`javascript
   import { initialize${featureName}Table } from '../models/${featureName.toLowerCase()}Model.js';
   
   export async function initializeDatabase() {
     // ... existing table initialization
     await initialize${featureName}Table();
   }
   \`\`\`

## Frontend Integration

1. Copy \`${featureName.toLowerCase()}Api.js\` to \`src/lib/\`

2. Use in your React components:
   \`\`\`javascript
   import { ${featureName.toLowerCase()}Api } from '@/lib/${featureName.toLowerCase()}Api';
   
   // In your component
   const { data, error } = await ${featureName.toLowerCase()}Api.getAll();
   \`\`\`

## API Endpoints

- \`POST /api/${featureName.toLowerCase()}s\` - Create new ${featureName.toLowerCase()}
- \`GET /api/${featureName.toLowerCase()}s\` - Get all ${featureName.toLowerCase()}s (paginated)
- \`GET /api/${featureName.toLowerCase()}s/:id\` - Get single ${featureName.toLowerCase()}
- \`PUT /api/${featureName.toLowerCase()}s/:id\` - Update ${featureName.toLowerCase()}
- \`DELETE /api/${featureName.toLowerCase()}s/:id\` - Delete ${featureName.toLowerCase()}

## Next Steps

1. Customize the validation schemas in the routes file
2. Add any additional business logic to the controller
3. Create React components for the frontend UI
4. Test the API endpoints with your frontend

`;
  
  fs.writeFileSync(
    path.join(outputDir, 'INTEGRATION_INSTRUCTIONS.md'), 
    integrationInstructions
  );
  
  console.log(`✅ Generated ${featureName} feature in ${outputDir}/`);
  console.log('📋 Check INTEGRATION_INSTRUCTIONS.md for setup steps');
}

/**
 * CLI interface
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🚀 Feature Generator

Usage: node generate-feature.js <FeatureName> [options]

Examples:
  node generate-feature.js UserProfile
  node generate-feature.js BlogPost
  node generate-feature.js FileUpload

This will generate:
  - Controller with CRUD operations
  - Routes with validation
  - Database model
  - Frontend API service
  - Integration instructions

Options:
  --table <name>     Custom table name (default: featurename + 's')
  --output <dir>     Output directory (default: './generated')

Field types supported:
  - string, text, number, decimal, boolean, date, datetime, timestamp, json
`);
    process.exit(0);
  }
  
  const featureName = args[0];
  const config = { featureName };
  
  // Parse options
  for (let i = 1; i < args.length; i += 2) {
    const option = args[i];
    const value = args[i + 1];
    
    if (option === '--table') {
      config.tableName = value;
    } else if (option === '--output') {
      config.outputDir = value;
    }
  }
  
  generateFeature(config);
}

export { generateFeature, templates, fieldTypes };