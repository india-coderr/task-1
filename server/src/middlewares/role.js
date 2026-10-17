const AppError = require('../utils/errors');

/**
 * Role-based access control middleware.
 * Verifies that the authenticated user possesses one of the allowed roles.
 *
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'staff')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required before role verification.', 401, 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden: requires ${roles.join(' or ')} role privileges.`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
};

module.exports = {
  requireRole
};
