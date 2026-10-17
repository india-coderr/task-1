/**
 * Wraps async Express handlers to forward thrown errors or rejected promises
 * to the centralized error-handling middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
