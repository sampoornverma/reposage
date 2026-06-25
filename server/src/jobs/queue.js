/**
 * BullMQ Queue Definition — "indexing-queue"
 * 
 * This file defines the QUEUE (the "todo list").
 * The Queue ADDS jobs. The Worker (separate file) PROCESSES jobs.
 * 
 * 🎤 Interview Point: "What is BullMQ?"
 * → BullMQ is a robust job queue for Node.js backed by Redis.
 *   It handles job persistence, retries, concurrency control,
 *   delayed jobs, and event-driven processing out of the box.
 * 
 * 🎤 Interview Point: "What is the Producer-Consumer pattern?"
 * → The Queue is the PRODUCER (adds jobs).
 *   The Worker is the CONSUMER (processes jobs).
 *   They are completely decoupled — the API server adds jobs
 *   and immediately responds to the user. The worker picks them
 *   up asynchronously. This is the same pattern used by
 *   YouTube (video processing), Uber (ride matching), and
 *   Amazon (order fulfillment).
 */

const { Queue } = require('bullmq');
const { REDIS_CONFIG } = require('../config/redis');



// The queue name is like a "channel" — workers subscribe to this exact name
const QUEUE_NAME = 'indexing-queue';



const indexingQueue = new Queue(QUEUE_NAME, {
  connection: REDIS_CONFIG,
  defaultJobOptions: {
    // ── Retry Strategy ────────────────────────────────────────
    // If a job fails, retry it up to 3 times with exponential backoff.
    // Attempt 1 fails → wait 2s → Attempt 2 fails → wait 4s → Attempt 3 fails → dead.
    //
    // 🎤 Interview Point: "Why exponential backoff?"
    // → If the failure is caused by a rate limit (e.g., OpenAI 429),
    //   retrying immediately would just get rate-limited again.
    //   Exponential backoff gives the API time to recover.
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds, then 4s, then 8s
    },

    // ── Job Cleanup ────────────────────────────────────────────
    // Keep the last 50 completed jobs and last 20 failed jobs in Redis
    // for debugging/dashboard purposes. Old jobs are auto-deleted.
    //
    // 🎤 Interview Point: "Why not keep all jobs forever?"
    // → Redis stores data in RAM. Keeping millions of completed job
    //   records would eat up server memory. We keep enough for
    //   debugging and monitoring, then let Redis garbage collect.
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 20 },
  },
});

/**
 * Add a repository indexing job to the queue.
 * 
 * @param {Object} jobData - { githubUrl, branch }
 * @returns {Object} - The BullMQ job object (contains job.id for tracking)
 * 
 * 🎤 Interview Point: "What does addJob return?"
 * → It returns immediately with a job ID. The API sends this ID
 *   back to the frontend so the user can poll for status updates.
 *   The actual processing hasn't started yet — that happens
 *   asynchronously in the Worker.
 */
async function addIndexingJob(jobData) {
  const job = await indexingQueue.add(
    'index-repo',   // Job name (for logging/filtering — you can have multiple job types per queue)
    jobData,        // The payload — { githubUrl, branch }
    {
      // Each job gets a unique ID based on the GitHub URL.
      // If someone submits the same repo twice, BullMQ can detect duplicates.
      jobId: `index-${Date.now()}-${jobData.githubUrl.split('/').pop()}`,
    }
  );

  console.log(`[QUEUE] 📥 Job ${job.id} added: ${jobData.githubUrl}`);
  return job;
}

/**
 * Get the current status of a job by its ID.
 * Used by the frontend to poll: "Is my repo done indexing yet?"
 * 
 * @param {string} jobId - The job ID returned by addIndexingJob
 * @returns {Object|null} - Job status info or null if not found
 */
async function getJobStatus(jobId) {
  const job = await indexingQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  return {
    id: job.id,
    state,             // 'waiting', 'active', 'completed', 'failed', 'delayed'
    data: job.data,
    progress: job.progress,
    result: job.returnvalue,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
  };
}

module.exports = {
  indexingQueue,
  addIndexingJob,
  getJobStatus,
  QUEUE_NAME,
};
