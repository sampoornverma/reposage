/**
 * Embedding Service
 * Converts code chunks into 1536-dimensional vectors using OpenRouter (OpenAI-compatible API).
 * Supports batching (multiple chunks per request) and retry logic with exponential backoff.
 */

const OpenAI = require('openai');
const env = require('../config/env');

// Initialize the OpenAI client pointed at OpenRouter's endpoint
// OpenRouter is API-compatible with OpenAI — same SDK, different baseURL
const openai = new OpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

// The embedding model we use
// text-embedding-3-small produces 1536-dimensional vectors
// It costs ~$0.02 per 1 million tokens — extremely cheap
const EMBEDDING_MODEL = 'openai/text-embedding-3-small';

// Maximum number of text inputs per single API call
// OpenAI allows up to 2048, but we keep it smaller to avoid timeouts
const BATCH_SIZE = 50;

// Maximum number of retry attempts if the API fails (rate limit, network error, etc.)
const MAX_RETRIES = 3
/**
 * Pauses execution for a given number of milliseconds.
 * Used between retries to give the API time to recover.
 * @param {number} ms - Milliseconds to wait
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates an embedding vector for a single piece of text.
 * @param {string} text - The code or text to embed
 * @returns {Array<number>} - A 1536-dimensional vector (array of floats)
 */
async function generateEmbedding(text) {
  const results = await generateEmbeddingsBatch([text]);
  return results[0];
}

/**
 * 
 * 
 * 
 * 
 * Generates embedding vectors for an array of texts in one API call.
 * This is more efficient than calling the API once per chunk.
 * @param {Array<string>} texts - Array of strings to embed
 * @returns {Array<Array<number>>} - Array of 1536-dimensional vectors
 */
async function generateEmbeddingsBatch(texts) {
  // Retry loop with exponential backoff
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts
      });

      // OpenRouter sometimes returns 200 OK but with an error object inside
      if (response.error) {
        throw new Error(response.error.message || 'OpenRouter returned an error object');
      }

      if (!response.data) {
        throw new Error(`Unexpected API Response: ${JSON.stringify(response)}`);
      }

      // The API returns embeddings in the same order as the input texts
      // Each item in response.data has an .embedding property (the vector)
      return response.data.map(item => item.embedding);

    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES;
      const isRateLimit = error.status === 429;
      const isServerError = error.status >= 500;
      // If we manually threw an error due to unexpected API response, treat it as retryable
      const isUnexpectedResponse = !error.status;

      // Only retry on rate limits (429), server errors (5xx), or unexpected responses
      if ((isRateLimit || isServerError || isUnexpectedResponse) && !isLastAttempt) {
        // Exponential backoff: wait 2s, then 4s, then 8s
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`[EMBEDDINGS] ⚠️ Attempt ${attempt} failed: ${error.message}. Retrying in ${waitTime / 1000}s...`);
        await sleep(waitTime);
        continue;
      }

      // If it's a non-retryable error or we've exhausted retries, throw
      console.error(`[EMBEDDINGS] ❌ Failed after ${attempt} attempts:`, error.message);
      throw error;
    }
  }
}

/**
 * 
 * 
 * 
 * Generates embeddings for a large array of chunks by splitting into batches.
 * This is what the indexing pipeline calls.
 *
 * @param {Array<Object>} chunks - Array of chunk objects (must have .content property)
 * @returns {Array<Object>} - Same chunks array but with .embedding added to each chunk
 */
async function embedChunks(chunks) {
  console.log(`[EMBEDDINGS] 🧠 Generating embeddings for ${chunks.length} chunks in batches of ${BATCH_SIZE}...`);

  let processedCount = 0;

  // Process chunks in batches of BATCH_SIZE
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    // Extract just the text content from each chunk for the API call
    const texts = batch.map(chunk => chunk.content);

    // Generate embeddings for this batch
    const embeddings = await generateEmbeddingsBatch(texts);

    // Attach each embedding back to its corresponding chunk object
    for (let j = 0; j < batch.length; j++) {
      batch[j].embedding = embeddings[j];
    }

    processedCount += batch.length;
    console.log(`[EMBEDDINGS] ✅ Progress: ${processedCount}/${chunks.length} chunks embedded`);
  }

  console.log(`[EMBEDDINGS] 🎉 All ${chunks.length} chunks embedded successfully!`);
  return chunks;
}

module.exports = {
  generateEmbedding,
  generateEmbeddingsBatch,
  embedChunks
};
