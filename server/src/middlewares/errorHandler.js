const AppError = require('../utils/errors');

/**
 * Centralized error handler middleware.
 * Ensures that ALL error responses strictly adhere to the expected format:
 * {
 *   "success": false,
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human-readable message",
 *     "details": [...]
 *   }
 * }
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred on the server.';
  let details = err.details || [];

  // 1. Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_RESOURCE_ID';
    message = `Invalid format for resource identifier: ${err.value}`;
  }

  // 2. Mongoose Schema Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    errorCode = 'SCHEMA_VALIDATION_ERROR';
    message = 'Data validation failed against database schema.';
    details = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message
    }));
  }

  // 3. MongoDB Duplicate Key (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY_CONFLICT';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const val = err.keyValue ? err.keyValue[field] : '';
    message = `Duplicate value '${val}' for unique field '${field}'.`;
  }

  // 4. JSON Web Token Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token provided.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired. Please sign in again.';
  }

  // 5. MongoDB Network, TLS, or Server Selection Errors
  if (
    err.name === 'MongoNetworkError' ||
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongoServerSelectionError' ||
    err.code === 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR' ||
    (err.message && (err.message.includes('SSL') || err.message.includes('buffering timed out') || err.message.includes('connect ECONNREFUSED')))
  ) {
    statusCode = 503;
    errorCode = 'DATABASE_UNAVAILABLE';
    message = 'Database service is currently unreachable or undergoing network maintenance. Please verify MongoDB connection and network access.';
  }

  // Log server errors for observability
  if (statusCode >= 500) {
    console.error(`[Server Error ${statusCode}]`, err);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details: Array.isArray(details) ? details : [details]
    }
  });
};

module.exports = errorHandler;
