/**
 * Redis Connection Config
 * 
 * WHY REDIS? (🎤 Interview Answer)
 * Redis is an in-memory data store. Unlike PostgreSQL (disk-based),
 * Redis reads/writes from RAM at microsecond speed.
 * BullMQ needs this speed because workers constantly ask:
 * "Any new jobs?" — doing this on Postgres would kill performance.
 * 
 * WHY ioredis? (🎤 Interview Answer)
 * ioredis is the most popular Redis client for Node.js.
 * BullMQ internally uses ioredis. We use it too for consistency
 * and because it supports cluster mode, sentinel, and pipelines.
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

/**
 * Creates a new Redis connection.
 * BullMQ requires separate connections for Queue and Worker,
 * so we use a factory function instead of sharing one connection.
 * 
 * 🎤 Interview Point: "Why a factory function?"
 * → Redis connections are stateful. If the Queue is mid-publish
 *   and the Worker tries to subscribe on the same connection,
 *   they interfere. Separate connections isolate them.
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
