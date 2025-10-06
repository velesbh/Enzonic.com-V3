/**
 * Validation Utilities
 * Reusable validation functions for common use cases
 */

/**
 * Basic validation helpers
 */

export function isEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isPhoneNumber(phone) {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

export function isURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isStrongPassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Data type validators
 */

export function validateString(value, options = {}) {
  const { minLength = 0, maxLength = Infinity, required = false, pattern } = options;
  
  if (required && !value) {
    return { valid: false, error: 'This field is required' };
  }
  
  if (!required && !value) {
    return { valid: true };
  }
  
  if (typeof value !== 'string') {
    return { valid: false, error: 'Must be a string' };
  }
  
  if (value.length < minLength) {
    return { valid: false, error: `Must be at least ${minLength} characters` };
  }
  
  if (value.length > maxLength) {
    return { valid: false, error: `Must be no more than ${maxLength} characters` };
  }
  
  if (pattern && !pattern.test(value)) {
    return { valid: false, error: 'Invalid format' };
  }
  
  return { valid: true };
}

export function validateNumber(value, options = {}) {
  const { min = -Infinity, max = Infinity, integer = false, required = false } = options;
  
  if (required && (value === null || value === undefined)) {
    return { valid: false, error: 'This field is required' };
  }
  
  if (!required && (value === null || value === undefined)) {
    return { valid: true };
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    return { valid: false, error: 'Must be a number' };
  }
  
  if (integer && !Number.isInteger(num)) {
    return { valid: false, error: 'Must be an integer' };
  }
  
  if (num < min) {
    return { valid: false, error: `Must be at least ${min}` };
  }
  
  if (num > max) {
    return { valid: false, error: `Must be no more than ${max}` };
  }
  
  return { valid: true };
}

export function validateEmail(value, required = false) {
  if (required && !value) {
    return { valid: false, error: 'Email is required' };
  }
  
  if (!required && !value) {
    return { valid: true };
  }
  
  if (!isEmail(value)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
}

export function validateArray(value, options = {}) {
  const { minLength = 0, maxLength = Infinity, itemValidator, required = false } = options;
  
  if (required && (!value || value.length === 0)) {
    return { valid: false, error: 'This field is required' };
  }
  
  if (!required && (!value || value.length === 0)) {
    return { valid: true };
  }
  
  if (!Array.isArray(value)) {
    return { valid: false, error: 'Must be an array' };
  }
  
  if (value.length < minLength) {
    return { valid: false, error: `Must have at least ${minLength} items` };
  }
  
  if (value.length > maxLength) {
    return { valid: false, error: `Must have no more than ${maxLength} items` };
  }
  
  if (itemValidator) {
    for (let i = 0; i < value.length; i++) {
      const result = itemValidator(value[i]);
      if (!result.valid) {
        return { valid: false, error: `Item ${i + 1}: ${result.error}` };
      }
    }
  }
  
  return { valid: true };
}

/**
 * Schema validator
 */

export function validateSchema(data, schema) {
  const errors = {};
  let isValid = true;
  
  for (const [field, validator] of Object.entries(schema)) {
    const value = data[field];
    const result = validator(value);
    
    if (!result.valid) {
      errors[field] = result.error;
      isValid = false;
    }
  }
  
  return { valid: isValid, errors };
}

/**
 * Common validation schemas
 */

export const commonValidators = {
  userProfile: {
    firstName: (value) => validateString(value, { required: true, minLength: 1, maxLength: 50 }),
    lastName: (value) => validateString(value, { required: true, minLength: 1, maxLength: 50 }),
    email: (value) => validateEmail(value, true),
    age: (value) => validateNumber(value, { min: 13, max: 120, integer: true }),
    bio: (value) => validateString(value, { maxLength: 500 })
  },
  
  userPreferences: {
    theme: (value) => validateString(value, { 
      required: true, 
      pattern: /^(light|dark|auto)$/ 
    }),
    language: (value) => validateString(value, { 
      required: true, 
      pattern: /^[a-z]{2}(-[A-Z]{2})?$/ 
    }),
    notifications: (value) => {
      if (typeof value !== 'object' || value === null) {
        return { valid: false, error: 'Must be an object' };
      }
      return { valid: true };
    }
  },
  
  fileUpload: {
    filename: (value) => validateString(value, { required: true, maxLength: 255 }),
    size: (value) => validateNumber(value, { required: true, min: 1, max: 50 * 1024 * 1024 }), // 50MB max
    mimetype: (value) => validateString(value, { required: true, maxLength: 100 })
  },
  
  translation: {
    sourceText: (value) => validateString(value, { required: true, minLength: 1, maxLength: 10000 }),
    translatedText: (value) => validateString(value, { required: true, minLength: 1, maxLength: 10000 }),
    sourceLang: (value) => validateString(value, { required: true, pattern: /^[a-z]{2}$/ }),
    targetLang: (value) => validateString(value, { required: true, pattern: /^[a-z]{2}$/ })
  }
};

/**
 * Express middleware for validation
 */

export function validateBody(schema) {
  return (req, res, next) => {
    const result = validateSchema(req.body, schema);
    
    if (!result.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.errors
      });
    }
    
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = validateSchema(req.query, schema);
    
    if (!result.valid) {
      return res.status(400).json({
        error: 'Query validation failed',
        details: result.errors
      });
    }
    
    next();
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    const result = validateSchema(req.params, schema);
    
    if (!result.valid) {
      return res.status(400).json({
        error: 'Parameter validation failed',
        details: result.errors
      });
    }
    
    next();
  };
}

/**
 * File validation
 */

export function validateFileUpload(options = {}) {
  const { 
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    allowedExtensions = []
  } = options;
  
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const file = req.file;
    
    // Check file size
    if (file.size > maxSize) {
      return res.status(400).json({ 
        error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB` 
      });
    }
    
    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
      });
    }
    
    // Check file extension
    if (allowedExtensions.length > 0) {
      const ext = file.originalname.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({ 
          error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}` 
        });
      }
    }
    
    next();
  };
}

/**
 * Sanitization helpers
 */

export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 10000); // Limit length
}

export function sanitizeObject(obj, allowedFields) {
  const sanitized = {};
  
  for (const field of allowedFields) {
    if (obj.hasOwnProperty(field)) {
      const value = obj[field];
      
      if (typeof value === 'string') {
        sanitized[field] = sanitizeString(value);
      } else {
        sanitized[field] = value;
      }
    }
  }
  
  return sanitized;
}

export default {
  validateString,
  validateNumber,
  validateEmail,
  validateArray,
  validateSchema,
  validateBody,
  validateQuery,
  validateParams,
  validateFileUpload,
  commonValidators,
  sanitizeString,
  sanitizeObject
};