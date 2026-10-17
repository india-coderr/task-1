const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/errors');

/**
 * Authentication middleware that validates incoming JWT Bearer token
 * and attaches authenticated user document to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required. Missing Bearer token.', 401, 'UNAUTHORIZED'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new AppError('Invalid token format.', 401, 'UNAUTHORIZED'));
    }

    const secret = process.env.JWT_SECRET || 'super_secret_foodly_pos_jwt_token_key_2026';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Session expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
      }
      return next(new AppError('Invalid or corrupted authorization token.', 401, 'INVALID_TOKEN'));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401, 'USER_NOT_FOUND'));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Contact an administrator.', 403, 'ACCOUNT_DEACTIVATED'));
    }

    // Attach to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate
};
