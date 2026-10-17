/**
 * Custom Application Error class extending native Error.
 * Allows passing an HTTP status code, machine-readable error code, and details array.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_SERVER_ERROR', details = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = Array.isArray(details) ? details : [details];
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
