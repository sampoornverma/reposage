const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.message);
  
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      error: true,
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
    });
  };
  
  module.exports = errorHandler;