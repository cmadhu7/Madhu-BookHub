/**
 * ============================================================
 * MADHU BOOKHUB — Global Error Handler Middleware
 * File: backend/middleware/errorHandler.js
 *
 * CONCEPT: Express Error Middleware
 * In Express, a middleware function with 4 parameters
 * (err, req, res, next) is treated as an error handler.
 * When any route calls next(error), Express skips all
 * normal middleware and jumps to this handler.
 *
 * WHAT: Catches all unhandled errors and sends safe responses.
 * WHY:  Centralizes error handling. Prevents stack traces
 *       from leaking to users. Ensures consistent error format.
 * HOW:  Registered as the LAST middleware in server.js.
 * ============================================================
 */

'use strict';

/**
 * Global error handler.
 * @param {Error} err   - The error object thrown/passed via next()
 * @param {object} req  - Express request
 * @param {object} res  - Express response
 * @param {function} next - Next middleware (required parameter even if unused)
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log the full error internally (for developer debugging)
  // Never send internal details to the client
  console.error(`[ERROR] ${req.method} ${req.url} →`, err.message);

  // Determine the HTTP status code
  // If the error has a status code already set, use it.
  // Otherwise default to 500 (Internal Server Error).
  const statusCode = err.statusCode || err.status || 500;

  // ── MySQL-specific errors ──────────────────────────────
  // Map MySQL error codes to user-friendly messages.
  // We do NOT expose raw MySQL errors to users.
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A duplicate entry was detected. This record may already exist.',
    });
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(503).json({
      success: false,
      message: 'The database is currently unavailable. Please try again later.',
    });
  }

  // ── Generic error response ────────────────────────────
  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? 'An internal server error occurred. Please try again later.'
        : err.message || 'An unexpected error occurred.',
  });
}

module.exports = errorHandler;
