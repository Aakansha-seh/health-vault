// Global error handler — mount LAST in Express pipeline
// Returns { error: string, details?: [...] } for all unhandled errors

export function errorHandler(err, req, res, next) {
  console.error('[ErrorHandler]', err);

  // Zod validation errors are wrapped and re-thrown by routes
  if (err.isZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues,
    });
  }

  // Prisma known errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({ error: 'A record with this value already exists (unique constraint)' });
      case 'P2025':
        return res.status(404).json({ error: 'Record not found' });
      case 'P2003':
        return res.status(400).json({ error: 'Foreign key constraint failed — related record does not exist' });
      default:
        break;
    }
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({ error: message });
}
