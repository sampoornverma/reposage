/**
 * Redis Connection Config
 */

const IORedis = require('ioredis');
const env = require('./env');

// Create a reusable Redis connection
// BullMQ needs a connection factory (a function that returns a NEW connection each time)
// because Queue and Worker need separate connections.

const REDIS_CONFIG = {
  host: env.REDIS_HOST || '127.0.0.1',     // localhost by default
  port: parseInt(env.REDIS_PORT) || 6379,    // Redis default port
  maxRetriesPerRequest: null,                // BullMQ REQUIRES this to be null
  enableReadyCheck: false,                   // Faster startup, BullMQ handles readiness itself
};

// If a REDIS_URL is provided (e.g., from Render or Upstash), parse it and override the host/port
if (process.env.REDIS_URL) {
  try {
    const url = new URL(process.env.REDIS_URL);
    REDIS_CONFIG.host = url.hostname;
    REDIS_CONFIG.port = url.port ? parseInt(url.port) : 6379;
    if (url.password) REDIS_CONFIG.password = decodeURIComponent(url.password);
    if (url.username) REDIS_CONFIG.username = decodeURIComponent(url.username);
    if (url.protocol === 'rediss:') {
      REDIS_CONFIG.tls = { rejectUnauthorized: false }; // Required for secure managed Redis
    }
  } catch (error) {
    console.warn('[REDIS] Failed to parse REDIS_URL, falling back to localhost');
  }
}

/**
 * Creates a new Redis connection.
 * BullMQ requires separate connections for Queue and Worker,
 * so we use a factory function instead of sharing one connection.
 */
function createRedisConnection() {
  return new IORedis(REDIS_CONFIG);
}

/**
 * Test the Redis connection — used at server startup to fail fast.
 * If Redis is not running, we want to know immediately, not when
 * the first job is submitted 10 minutes later.
 */
async function testRedisConnection() {
  const testConn = createRedisConnection();
  try {
    const pong = await testConn.ping();
    if (pong === 'PONG') {
      console.log('✅ Redis connected successfully');
    }
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.error('   Make sure Redis is running: brew services start redis');
    throw error;
  } finally {
    await testConn.quit();
  }
}

module.exports = {
  REDIS_CONFIG,
  createRedisConnection,
  testRedisConnection,
};
