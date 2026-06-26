/**
 * Retrieval & RAG Service (Day 7)
 * 
 * 🎤 INTERVIEW POINT: "How does your RAG retrieval engine work?"
 * Answer: "It's a 3-step pipeline:
 * 1. Embed the user's question into a 1536-dimensional vector using OpenAI.
 * 2. Query Postgres (pgvector) using Cosine Similarity to find the top 5 most relevant code chunks for that specific repository.
 * 3. Assemble those chunks into a prompt and stream the LLM response back to the client using Server-Sent Events (SSE)."
 */

const OpenAI = require('openai');
const { generateEmbedding } = require('./embeddingService');
const { supabase } = require('../config/supabase');
const env = require('../config/env');

const openai = new OpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

/**
 * Searches the database for code chunks most relevant to the question.
 * @param {string} question - The user's query
 * @param {string} repositoryId - UUID of the repo in Supabase
 * @param {number} matchCount - How many chunks to return
 * @returns {Array} - Array of top matching code chunks
 */

async function retrieveRelevantContext(question, repositoryId, matchCount = 5) {
  console.log(`[RETRIEVAL] 🔍 Embedding user question: "${question}"`);
  
  // 1. Convert the question into a vector
  const queryEmbedding = await generateEmbedding(question);

  console.log(`[RETRIEVAL] 🔎 Searching Supabase for top ${matchCount} matches...`);
  
  // 2. Call our custom Postgres function (match_chunks)
  // This now runs our Reciprocal Rank Fusion (RRF) Hybrid Search
  const { data: chunks, error } = await supabase.rpc('match_chunks', {
    query_embedding: queryEmbedding,
    query_text: question,
    match_count: matchCount,
    repo_id: repositoryId
  });

  if (error) {
    console.error('[RETRIEVAL] ❌ Supabase search failed:', error.message);
    throw error;
  }

  console.log(`[RETRIEVAL] ✅ Found ${chunks?.length || 0} matching chunks.`);
  return chunks || [];
}

/**
 * Assembles the context and returns an async stream from OpenAI.
 * We return the stream itself so the Express route can pipe it to the client via SSE.
 * 
 * @param {string} question - The user's query
 * @param {Array} chunks - The retrieved code chunks
 * @returns {AsyncIterable} - The OpenAI response stream
 */
async function generateAnswerStream(question, chunks) {
  // 3. Assemble the prompt context
  let contextString = '';
  if (chunks.length === 0) {
    contextString = 'No relevant code found in this repository.';
  } else {
    // Combine all retrieved chunks into a single string for the LLM to read
    contextString = chunks.map(c => `
--- File: ${c.file_path} (Lines ${c.start_line}-${c.end_line}) ---
\`\`\`
${c.content}
\`\`\`
    `).join('\n');
  }

  const systemPrompt = `
You are a senior software engineer assistant. You are answering a question about a specific GitHub repository.
Use ONLY the provided code snippets to answer the question. 
If the answer is not contained in the snippets, say "I don't have enough context in the codebase to answer that."
Always cite the file paths and line numbers when you reference code.

CODE CONTEXT:
${contextString}
  `;

  console.log('[RETRIEVAL] 🤖 Sending prompt to LLM (Streaming)...');

  // 4. Call LLM with streaming enabled
  const stream = await openai.chat.completions.create({
    model: 'openai/gpt-4o-mini', // Or whatever model you prefer via OpenRouter
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ],
    stream: true, // This is crucial for SSE
  });

  return stream;
}

/**
 * Strict Mode (Rebuild): Generates the full answer in memory without streaming.
 * Checks for hallucinated file citations. If found, automatically retries by telling
 * the LLM to fix its mistakes.
 */
async function generateStrictAnswer(question, chunks, maxRetries = 1) {
  const { validateCitations } = require('./citationValidator');
  
  let contextString = chunks.length === 0 ? 'No relevant code found.' : chunks.map(c => `
--- File: ${c.file_path} (Lines ${c.start_line}-${c.end_line}) ---
\`\`\`\n${c.content}\n\`\`\`
  `).join('\n');

  let systemPrompt = `You are a senior software engineer assistant. Answer using ONLY the provided code snippets. Always cite file paths. CODE CONTEXT:\n${contextString}`;
  let messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question }
  ];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    console.log(`[STRICT MODE] 🤖 Generating full response (Attempt ${attempt + 1})...`);
    
    const response = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: messages,
      stream: false, // Wait for full response
    });

    const generatedText = response.choices[0].message.content;
    const hallucinations = validateCitations(generatedText, chunks);

    if (hallucinations.length === 0) {
      console.log('[STRICT MODE] ✅ Validation passed. No hallucinations.');
      return generatedText;
    }

    console.log(`[STRICT MODE] ⚠️ Hallucinations detected: ${hallucinations.join(', ')}`);
    
    if (attempt < maxRetries) {
      // Append the error to the conversation history so the LLM fixes it
      messages.push({ role: 'assistant', content: generatedText });
      messages.push({ 
        role: 'user', 
        content: `CRITICAL ERROR: You cited the following files which do NOT exist in the provided context: ${hallucinations.join(', ')}. Please rewrite your answer using ONLY the files provided in the original context.` 
      });
    } else {
      console.warn('[STRICT MODE] ❌ Max retries reached. Returning answer with hallucination warning.');
      return generatedText + `\n\n*(⚠️ Safety Warning: The AI may have hallucinated the following files: ${hallucinations.join(', ')})*`;
    }
  }
}

module.exports = {
  retrieveRelevantContext,
  generateAnswerStream,
  generateStrictAnswer
};
