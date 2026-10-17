/**
 * Standard API Response Utilities
 * Enforces consistent shape:
 * Success: { success: true, data: ... }
 * Error:   { success: false, error: { code, message, details } }
 */

const sendSuccess = (res, data, statusCode = 200, meta = undefined) => {
  const payload = {
    success: true,
    data
  };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
};

const sendError = (res, code, message, details = [], statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: Array.isArray(details) ? details : [details]
    }
  });
};

module.exports = {
  sendSuccess,
  sendError
};
