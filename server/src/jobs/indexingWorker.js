/**
 * BullMQ Worker — The Background Processor
 * 
 * This file runs SEPARATELY from the Express server.
 * It connects to the same Redis instance, subscribes to 'indexing-queue',
 * and processes jobs one by one.
 * 
 * 🎤 Interview Point: "Why is the worker a separate file?"
 * → Separation of Concerns. The Express server's job is to handle
 *   HTTP requests fast (< 200ms). The worker's job is to do heavy
 *   computation (cloning, parsing, embedding — minutes of work).
 *   If they ran in the same process, a heavy indexing job could
 *   block the event loop and freeze ALL API responses.
 *   In production, you'd run the worker on a completely separate server.
 * 
 * 🎤 Interview Point: "What is the Node.js Event Loop?"
 * → Node.js is single-threaded. It processes one task at a time on
 *   the main thread (the "event loop"). If a CPU-heavy task blocks
 *   the event loop, EVERY incoming HTTP request is frozen until
 *   that task finishes. By offloading heavy work to a worker
 *   process, the API server's event loop stays free to handle
 *   user requests instantly.
 */

const { Worker } = require('bullmq');
const { REDIS_CONFIG } = require('../config/redis');
const { indexRepository } = require('../services/indexingPipeline');
const { QUEUE_NAME } = require('./queue');

/**
 * Create and start the indexing worker.
 * 
 * @param {Object} options - Worker configuration
 * @param {number} options.concurrency - How many jobs to process simultaneously
 * @returns {Worker} - The BullMQ worker instance
 * 
 * 🎤 Interview Point: "Why concurrency: 2?"
 * → Each indexing job calls the OpenAI embedding API.
 *   If we process 10 repos simultaneously, we'd hit the API
 *   rate limit instantly. Concurrency 2 means we process
 *   at most 2 repos at the same time — a balance between
 *   speed and not getting rate-limited.
 */
function createIndexingWorker(concurrency = 2) {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      // ─────────────────────────────────────────────────────────
      // This function runs for EVERY job in the queue.
      // job.data contains { githubUrl, branch } — whatever we passed in addIndexingJob()
      // ─────────────────────────────────────────────────────────

      const { githubUrl, branch } = job.data;
      console.log(`\n[WORKER] 🚀 Processing job ${job.id}: ${githubUrl}`);

      // Report progress (0-100) — the frontend can display this
      await job.updateProgress(10);

      // Run the EXACT SAME pipeline we tested before.
      // The only difference? It's now running in a background worker,
      // NOT inside an Express route handler.
      const result = await indexRepository(githubUrl, branch);

      await job.updateProgress(100);
      console.log(`[WORKER] ✅ Job ${job.id} completed: ${result.totalChunks} chunks indexed`);

      // Whatever we return here becomes job.returnvalue
      // The frontend can fetch this via getJobStatus()
      return result;
    },
    {
      connection: REDIS_CONFIG,
      concurrency,
    }
  );

  // ── Worker Event Listeners ──────────────────────────────────
  // These are for logging and monitoring. In production, you'd
  // send these events to a monitoring tool like Datadog or Grafana.

  worker.on('completed', (job) => {
    console.log(`[WORKER] ✅ Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[WORKER] ❌ Job ${job?.id} failed: ${error.message}`);
    console.error(`[WORKER]    Attempts made: ${job?.attemptsMade}/${job?.opts?.attempts || 3}`);
  });

  worker.on('error', (error) => {
    // This fires for connection errors, not job failures
    console.error('[WORKER] ⚠️ Worker error:', error.message);
  });

  console.log(`[WORKER] 👷 Indexing worker started (concurrency: ${concurrency})`);
  return worker;
}

module.exports = { createIndexingWorker };
