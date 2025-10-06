/**
 * Response Utilities
 * Standardized response helpers for consistent API responses
 */

/**
 * Success response helpers
 */

export function successResponse(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

export function createdResponse(res, data = null, message = 'Resource created successfully') {
  return successResponse(res, data, message, 201);
}

export function noContentResponse(res, message = 'Operation completed successfully') {
  return res.status(204).json({
    success: true,
    message,
    timestamp: new Date().toISOString()
  });
}

/**
 * Error response helpers
 */

export function errorResponse(res, message = 'An error occurred', statusCode = 500, details = null) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    details,
    timestamp: new Date().toISOString()
  });
}

export function validationErrorResponse(res, errors, message = 'Validation failed') {
  return res.status(400).json({
    success: false,
    error: message,
    details: errors,
    timestamp: new Date().toISOString()
  });
}

export function unauthorizedResponse(res, message = 'Unauthorized access') {
  return errorResponse(res, message, 401);
}

export function forbiddenResponse(res, message = 'Access forbidden') {
  return errorResponse(res, message, 403);
}

export function notFoundResponse(res, message = 'Resource not found') {
  return errorResponse(res, message, 404);
}

export function conflictResponse(res, message = 'Resource conflict') {
  return errorResponse(res, message, 409);
}

export function tooManyRequestsResponse(res, message = 'Too many requests') {
  return errorResponse(res, message, 429);
}

/**
 * Paginated response helper
 */

export function paginatedResponse(res, data, pagination, message = 'Success') {
  return res.json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * File response helpers
 */

export function fileResponse(res, filePath, filename = null) {
  if (filename) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }
  return res.sendFile(filePath);
}

export function base64FileResponse(res, base64Data, mimetype, filename = null) {
  const buffer = Buffer.from(base64Data, 'base64');
  
  res.setHeader('Content-Type', mimetype);
  if (filename) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }
  
  return res.send(buffer);
}

/**
 * Cache response helpers
 */

export function cachedResponse(res, data, maxAge = 3600) {
  res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
  return successResponse(res, data);
}

export function noCacheResponse(res, data, message = 'Success') {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return successResponse(res, data, message);
}

/**
 * CORS response helpers
 */

export function corsResponse(res, allowedOrigins = ['*'], allowedMethods = ['GET', 'POST', 'PUT', 'DELETE']) {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins.join(', '));
  res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res.status(200).end();
}

/**
 * Stream response helpers
 */

export function streamResponse(res, stream, mimetype = 'application/octet-stream', filename = null) {
  res.setHeader('Content-Type', mimetype);
  if (filename) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }
  
  return stream.pipe(res);
}

/**
 * Server-Sent Events helper
 */

export function sseResponse(res, data = null, event = 'message', id = null) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  if (id) {
    res.write(`id: ${id}\n`);
  }
  
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  
  return res;
}

/**
 * Health check response
 */

export function healthResponse(res, checks = {}) {
  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
  const statusCode = allHealthy ? 200 : 503;
  
  return res.status(statusCode).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks
  });
}

/**
 * Response middleware wrapper
 */

export function responseHelpers(req, res, next) {
  // Add all helper methods to the response object
  res.success = (data, message, statusCode) => successResponse(res, data, message, statusCode);
  res.created = (data, message) => createdResponse(res, data, message);
  res.noContent = (message) => noContentResponse(res, message);
  
  res.error = (message, statusCode, details) => errorResponse(res, message, statusCode, details);
  res.validationError = (errors, message) => validationErrorResponse(res, errors, message);
  res.unauthorized = (message) => unauthorizedResponse(res, message);
  res.forbidden = (message) => forbiddenResponse(res, message);
  res.notFound = (message) => notFoundResponse(res, message);
  res.conflict = (message) => conflictResponse(res, message);
  res.tooManyRequests = (message) => tooManyRequestsResponse(res, message);
  
  res.paginated = (data, pagination, message) => paginatedResponse(res, data, pagination, message);
  res.cached = (data, maxAge) => cachedResponse(res, data, maxAge);
  res.noCache = (data, message) => noCacheResponse(res, data, message);
  res.health = (checks) => healthResponse(res, checks);
  
  next();
}

/**
 * Error handling middleware
 */

export function errorHandler(error, req, res, next) {
  console.error('Unhandled error:', error);
  
  // Database errors
  if (error.code === 'ER_DUP_ENTRY') {
    return conflictResponse(res, 'Resource already exists');
  }
  
  if (error.code === 'ER_NO_SUCH_TABLE') {
    return errorResponse(res, 'Database table not found', 500);
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return unauthorizedResponse(res, 'Invalid token');
  }
  
  if (error.name === 'TokenExpiredError') {
    return unauthorizedResponse(res, 'Token expired');
  }
  
  // Validation errors
  if (error.name === 'ValidationError') {
    return validationErrorResponse(res, error.errors, 'Validation failed');
  }
  
  // File upload errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return errorResponse(res, 'File too large', 400);
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return errorResponse(res, 'Unexpected file field', 400);
  }
  
  // Network errors
  if (error.code === 'ECONNREFUSED') {
    return errorResponse(res, 'Service unavailable', 503);
  }
  
  // Generic error
  return errorResponse(res, 'Internal server error', 500);
}

/**
 * 404 handler
 */

export function notFoundHandler(req, res) {
  return notFoundResponse(res, `Route ${req.method} ${req.path} not found`);
}

/**
 * Request logger middleware
 */

export function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}

export default {
  successResponse,
  createdResponse,
  noContentResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  tooManyRequestsResponse,
  paginatedResponse,
  fileResponse,
  base64FileResponse,
  cachedResponse,
  noCacheResponse,
  corsResponse,
  streamResponse,
  sseResponse,
  healthResponse,
  responseHelpers,
  errorHandler,
  notFoundHandler,
  requestLogger
};