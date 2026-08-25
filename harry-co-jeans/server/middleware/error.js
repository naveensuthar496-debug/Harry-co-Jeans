'use strict';

/** A small helper to throw HTTP-aware errors from routes/services. */
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Wrap an async route handler so thrown errors reach the error middleware. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/** 404 for unmatched /api routes. */
function notFound(req, res) {
  res.status(404).json({ error: 'Not found', path: req.path });
}

/** Central error handler. Maps HttpError + common SQLite errors to JSON. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  const msg = String(err && err.message);
  if (/UNIQUE constraint failed/.test(msg)) {
    return res.status(409).json({ error: 'That record already exists.' });
  }
  if (/FOREIGN KEY constraint failed/.test(msg)) {
    return res.status(400).json({ error: 'Referenced record does not exist.' });
  }
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { HttpError, asyncHandler, notFound, errorHandler };
