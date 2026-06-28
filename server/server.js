const app = require('./src/app');
const env = require('./src/config/env');
const { testRedisConnection } = require('./src/config/redis');
const { createIndexingWorker } = require('./src/jobs/indexingWorker');

const PORT = env.PORT || 3001;

// 1. Test Redis Connection before starting the server
testRedisConnection()
  .then(() => {
    // 2. Start the BullMQ Worker (Running in the background)
    // Concurrency is set to 2 to prevent OpenAI API rate limits
    createIndexingWorker(2);

    // 3. Start the Express API Server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`=========================================`);
      console.log(`🚀 RepoSage Server running in ${env.NODE_ENV} mode`);
      console.log(`📡 Listening on port ${PORT} (0.0.0.0)`);
      console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
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
  })
  .catch((err) => {
    console.error('❌ Failed to start application:', err.message);
    process.exit(1);
  });

// Gracefully handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]: Shutting down server...');
  console.error(err.message);
  server.close(() => {
    process.exit(1);
  });
});
