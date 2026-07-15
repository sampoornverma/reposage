/**
 * BullMQ Worker — The Background Processor
 * 
 * This file runs SEPARATELY from the Express server.
 * It connects to the same Redis instance, subscribes to 'indexing-queue',
 * and processes jobs one by one.
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
