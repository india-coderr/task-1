const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

/**
 * Handle user login with email and password.
 * Issues a signed JWT on success.
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
  }

  if (!user.isActive) {
    return next(new AppError('Account is deactivated. Contact an administrator.', 403, 'ACCOUNT_DEACTIVATED'));
  }

  const payload = {
    id: user._id,
    role: user.role,
    name: user.name,
    email: user.email
  };

  const secret = process.env.JWT_SECRET || 'super_secret_foodly_pos_jwt_token_key_2026';
  const token = jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });

  return sendSuccess(res, {
    user: user.toJSON(),
    token
  });
};

/**
 * Return the current authenticated user's profile.
 */
const getMe = async (req, res) => {
  return sendSuccess(res, {
    user: req.user.toJSON()
  });
};

module.exports = {
  login,
  getMe
};
