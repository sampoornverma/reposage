/**
 * Markdown Chunker
 * Specialized chunker for .md files (like READMEs or documentation).
 * Instead of splitting arbitrarily by line count, it splits by Markdown Headings (#).
 */

const crypto = require('crypto');

function generateChunkId(filePath, startLine) {
  return crypto.createHash('sha256').update(`${filePath}:${startLine}`).digest('hex');
}

/**
 * Chunks a markdown file by its headings.
 */
async function chunkMarkdown(fileContent, filePath) {
  const chunks = [];
  const lines = fileContent.split('\n');
  
  let currentHeader = 'Introduction';
  let currentContent = [];
  let startLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // If we hit a new heading (e.g., # Title or ## Subtitle)
    if (line.trim().startsWith('#')) {
      // Save the previous section if it has content
      if (currentContent.length > 0) {
        chunks.push({
          id: generateChunkId(filePath, startLine),
          filePath,
          content: `Section: ${currentHeader}\n\n${currentContent.join('\n')}`,
          startLine,
          endLine: i,
          chunkType: 'markdown_section'
        });
      }

      // Start a new section
      currentHeader = line.trim();
      currentContent = [line];
      startLine = i + 1;
    } else {
      // Add line to current section
      currentContent.push(line);
    }
  }

  // Push the final section
  if (currentContent.length > 0) {
    chunks.push({
      id: generateChunkId(filePath, startLine),
      filePath,
      content: `Section: ${currentHeader}\n\n${currentContent.join('\n')}`,
      startLine,
      endLine: lines.length,
      chunkType: 'markdown_section'
    });
  }

  return chunks;
}

module.exports = {
  chunkMarkdown
};
