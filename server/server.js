const app = require('./src/app');
const env = require('./src/config/env');

const PORT = env.PORT || 3001;

const server = app.listen(PORT, '127.0.0.1',() => {
  console.log(`=========================================`);
  console.log(`🚀 RepoSage Server running in ${env.NODE_ENV} mode`);
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`=========================================`);
});

// Gracefully handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]: Shutting down server...');
  console.error(err.message);
  server.close(() => {
    process.exit(1);
  });
});
