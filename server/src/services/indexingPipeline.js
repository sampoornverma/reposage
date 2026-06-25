/**
 * Indexing Pipeline
 * Orchestrates the entire flow: clone → walk → chunk → embed → save to Supabase.
 * This is the single function that ties all our services together.
 */

const fs = require('fs');
const { cloneRepository, cleanupClone } = require('./repoCloner');
const { walkFiles } = require('./fileWalker');
const { chunkFile } = require('./chunker');
const { embedChunks } = require('./embeddingService');
const { supabase } = require('../config/supabase');

// How many chunks to insert into Supabase per database call
// Supabase has a payload size limit, so we insert in batches
const DB_INSERT_BATCH_SIZE = 50;

/**
 * Runs the full indexing pipeline for a GitHub repository.
 *
 * @param {string} githubUrl - The GitHub URL to index (e.g. https://github.com/expressjs/express)
 * @param {string|null} branch - Optional branch name (null = use repo's default)
 * @returns {Object} - Summary of what was indexed
 */
async function indexRepository(githubUrl, branch = null) {
  let localPath = null;

  // Step 1: Create a repository record in Supabase with status "indexing"
  const { data: repo, error: repoError } = await supabase
    .from('repositories')
    .insert({
      github_url: githubUrl,
      repo_name: extractRepoName(githubUrl),
      branch: branch,
      status: 'indexing'
    })
    .select()
    .single();

  if (repoError) throw repoError;

  console.log(`[PIPELINE] 🚀 Starting indexing for "${repo.repo_name}" (ID: ${repo.id})`);

  try {
    // Step 2: Clone the repository
    console.log('[PIPELINE] 📥 Cloning repository...');
    const cloneResult = await cloneRepository(githubUrl, branch);
    localPath = cloneResult.localPath;

    // Step 3: Walk the file tree
    console.log('[PIPELINE] 📂 Walking file tree...');
    const files = walkFiles(localPath);

    // Step 4: Read and chunk all files
    console.log('[PIPELINE] 🔪 Chunking files...');
    const allChunks = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(file.absolutePath, 'utf8');
        const chunks = chunkFile(content, file.relativePath);
        allChunks.push(...chunks);
      } catch (readError) {
        console.warn(`[PIPELINE] ⚠️ Skipping unreadable file: ${file.relativePath}`);
      }
    }

    // Step 5: Clean up cloned files (we've read everything into memory)
    console.log('[PIPELINE] 🧹 Cleaning up cloned files...');
    cleanupClone(localPath);
    localPath = null; // Mark as cleaned so the catch block doesn't double-clean



    // Step 6: Generate embeddings for ALL chunks
    console.log(`[PIPELINE] 🧠 Embedding ${allChunks.length} chunks...`);
    await embedChunks(allChunks);

    // Step 7: Save all chunks to Supabase in batches
    console.log(`[PIPELINE] 💾 Saving ${allChunks.length} chunks to Supabase...`);
    await saveChunksToSupabase(allChunks, repo.id);

    // Step 8: Update repository status to "completed"
    await supabase
      .from('repositories')
      .update({
        status: 'completed',
        total_files: files.length,
        total_chunks: allChunks.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', repo.id);

    console.log(`[PIPELINE] ✅ Indexing complete for "${repo.repo_name}"! ${allChunks.length} chunks saved.`);

    return {
      repositoryId: repo.id,
      repoName: repo.repo_name,
      totalFiles: files.length,
      totalChunks: allChunks.length,
      status: 'completed'
    };

  } catch (error) {
    // If anything fails, update the repo status to "failed" with the error message
    console.error(`[PIPELINE] ❌ Indexing failed for "${repo.repo_name}":`, error.message);

    await supabase
      .from('repositories')
      .update({
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', repo.id);

    // Clean up cloned files if they still exist
    if (localPath) {
      cleanupClone(localPath);
    }

    throw error;
  }
}



/**
 * Saves chunks with embeddings to Supabase in batches.
 * We can't insert 853 rows in one call (payload too large), so we batch them.
 *
 * @param {Array<Object>} chunks - Array of chunk objects with .embedding attached
 * @param {string} repositoryId - UUID of the parent repository
 */
async function saveChunksToSupabase(chunks, repositoryId) {
  for (let i = 0; i < chunks.length; i += DB_INSERT_BATCH_SIZE) {
    const batch = chunks.slice(i, i + DB_INSERT_BATCH_SIZE);

    const rows = batch.map(chunk => ({
      repository_id: repositoryId,
      file_path: chunk.filePath,
      content: chunk.content,
      start_line: chunk.startLine,
      end_line: chunk.endLine,
      chunk_type: chunk.type,
      node_type: chunk.nodeType || null,
      embedding: JSON.stringify(chunk.embedding)
    }));

    const { error } = await supabase.from('chunks').insert(rows);

    if (error) {
      console.error(`[PIPELINE] ❌ Failed to insert batch starting at chunk ${i}:`, error.message);
      throw error;
    }

    console.log(`[PIPELINE] 💾 Saved ${Math.min(i + DB_INSERT_BATCH_SIZE, chunks.length)}/${chunks.length} chunks`);
  }
}

/**
 * Extracts the repository name from a GitHub URL.
 * Example: "https://github.com/expressjs/express" → "express"
 *
 * @param {string} githubUrl - The GitHub URL
 * @returns {string} - Repository name
 */
function extractRepoName(githubUrl) {
  const parts = githubUrl.replace(/\.git$/, '').split('/');
  return parts[parts.length - 1];
}

module.exports = {
  indexRepository
};
