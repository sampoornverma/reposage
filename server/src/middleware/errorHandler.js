const env = require('../config/env');

/**
 * Global Error Handling Middleware for Express
 * In Express, a middleware function with exactly 4 parameters is treated as an error handler.
 */
const errorHandler = (err, req, res, next) => {
  // Log the complete error trace to our server console for debugging
  console.error('[SERVER ERROR]:', {
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Default to 500 (Internal Server Error) if no specific status code was set
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      // Only attach full stack trace if we are in local development mode
      ...(env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;
