const AppError = require('../utils/errors');

/**
 * Zod request validation middleware.
 * Validates body, query, and params against the provided Zod schema.
 *
 * @param {import('zod').ZodSchema} schema
 */
const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        path: issue.path.join('.').replace(/^(body|query|params)\./, ''),
        message: issue.message
      }));

      return next(
        new AppError('Invalid request parameters or payload.', 422, 'VALIDATION_ERROR', details)
      );
    }

    // Assign sanitized / coerced data back
    if (parsed.data.body) req.body = parsed.data.body;
    if (parsed.data.query) req.query = parsed.data.query;
    if (parsed.data.params) req.params = parsed.data.params;

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  validate
};
