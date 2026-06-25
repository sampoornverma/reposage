const { chunkFileAST } = require('./astChunker');
const { chunkFileNaive } = require('./naiveChunker');

/**
 * Chunker Factory
 * Directs files to the appropriate chunker based on file extension.
 * JavaScript/TypeScript files use AST chunking, others fall back to naive.
 *
 * @param {string} content - The full content of the file.
 * @param {string} filePath - Path of the file (to determine extension).
 * @param {Object} options - Custom chunking options.
 * @returns {Array<Object>} Array of chunk objects.
 */
function chunkFile(content, filePath, options = {}) {
  // Find the file extension (e.g. '.js', '.ts', '.py')
  const extIndex = filePath.lastIndexOf('.');
  const extension = extIndex !== -1 ? filePath.slice(extIndex).toLowerCase() : '';

  // JavaScript/TypeScript files get AST-based parsing
  const AST_SUPPORTED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

  if (AST_SUPPORTED_EXTENSIONS.has(extension)) {
    return chunkFileAST(content, filePath, options);
  }

  // Fallback to simple line-based sliding window chunker for everything else
  return chunkFileNaive(content, filePath, options);
}

module.exports = {
  chunkFile
};
