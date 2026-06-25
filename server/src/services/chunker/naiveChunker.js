/**
 * Naive Chunker (Baseline Strategy)
 * Splits a file into fixed-size windows of lines with a defined overlap.
 * Since it is line-based, it ensures we never cut a single line of code in half.
 */

/**
 * Splits file content into chunks based on line count.
 * @param {string} content - The full content of the file.
 * @param {string} filePath - The relative or absolute path to the file.
 * @param {Object} options - Chunking options.
 * @param {number} options.chunkSize - Number of lines per chunk (default: 50).
 * @param {number} options.overlap - Number of lines to overlap between chunks (default: 10).
 * @returns {Array<Object>} Array of chunk objects with content and line metadata.
 */
function chunkFileNaive(content, filePath, options = {}) {
  const chunkSize = options.chunkSize || 50;
  const overlap = options.overlap || 10;

  // Input validation to prevent infinite loops or invalid states
  if (chunkSize <= 0) {
    throw new Error('chunkSize must be greater than 0');
  }
  if (overlap < 0 || overlap >= chunkSize) {
    throw new Error('overlap must be non-negative and less than chunkSize');
  }

  // Split content by newline characters (supports both Unix \n and Windows \r\n)
  const lines = content.split(/\r?\n/);
  const totalLines = lines.length;
  const chunks = [];

  // Edge case: If the entire file is smaller than one chunk size, return it as a single chunk
  if (totalLines <= chunkSize) {
    chunks.push({
      content: content,
      filePath: filePath,
      startLine: 1,
      endLine: totalLines || 1, // Fallback to 1 if the file is empty
      type: 'naive'
    });
    return chunks;
  }

  let start = 0;
  while (start < totalLines) {
    let end = start + chunkSize;
    
    // Ensure we don't read past the end of the file
    if (end > totalLines) {
      end = totalLines;
    }

    // Extract the lines for this chunk
    const chunkLines = lines.slice(start, end);
    
    chunks.push({
      content: chunkLines.join('\n'),
      filePath: filePath,
      startLine: start + 1, // 1-indexed for human readability (and IDE sync)
      endLine: end,
      type: 'naive'
    });

    // If we just processed up to the very last line of the file, we are done
    if (end === totalLines) {
      break;
    }

    // Calculate the next start index by stepping forward (chunkSize - overlap)
    start = start + (chunkSize - overlap);
  }

  return chunks;
}

module.exports = {
  chunkFileNaive
};
