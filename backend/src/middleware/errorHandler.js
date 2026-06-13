'use strict';
const env = require('../config/env');

/**
 * Global error handler — must be the last middleware registered.
 * Returns structured JSON for every unhandled error.
 */
module.exports = (err, req, res, next) => {
  console.error('[Error]', err);

  // Prisma: unique constraint violation (P2002)
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `A record with this ${err.meta?.target?.join(', ')} already exists.`,
    });
  }

  // Prisma: record not found (P2025)
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found.' });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors:  err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }

  const status  = err.status || err.statusCode || 500;
  const message = env.IS_PROD ? 'Internal server error.' : (err.message || 'Internal server error.');

  res.status(status).json({ success: false, message });
};
