/**
 * Citation Validator Service
 * 
 * 🎤 INTERVIEW POINT: "How do you handle AI hallucinations in your RAG pipeline?"
 * Answer: "I built a Citation Validator that parses the LLM's final response for any file paths 
 * (e.g. `src/utils.js`). It cross-references those paths against the actual metadata of the chunks 
 * we retrieved from Postgres. If the LLM cited a file that we didn't provide in the context, 
 * we flag it as a hallucination."
 */

/**
 * Extracts potential file paths from a block of text.
 * Looks for common patterns like `src/app.js`, `utils/math.ts`, etc.
 * @param {string} text - The LLM generated response
 * @returns {Array<string>} - Array of extracted file paths
 */
function extractFilePaths(text) {
  // Regex to match typical file paths with extensions (e.g. src/utils.js, app/main.ts, docs/readme.md)
  // This is a simplified regex for MVP purposes.
  const pathRegex = /[a-zA-Z0-9_\-\/]+\.[a-zA-Z0-9]+/g;
  const matches = text.match(pathRegex);
  
  if (!matches) return [];
  
  // Deduplicate and filter out obvious false positives (like sentence.end)
  const uniqueMatches = [...new Set(matches)];
  return uniqueMatches.filter(path => path.includes('/')); // simple heuristic: a path usually has a slash
}

/**
 * Validates citations against the retrieved context chunks.
 * @param {string} generatedText - The LLM's full answer
 * @param {Array} retrievedChunks - The array of chunk objects returned by Supabase
 * @returns {Array<string>} - Array of hallucinated (invalid) file paths
 */
function validateCitations(generatedText, retrievedChunks) {
  const citedPaths = extractFilePaths(generatedText);
  if (citedPaths.length === 0) return []; // No citations made

  // Create a Set of valid paths from our chunks for O(1) lookup
  const validPaths = new Set(retrievedChunks.map(chunk => chunk.file_path));

  const hallucinations = [];

  for (const cited of citedPaths) {
    // If the cited path is not exactly in our valid paths, check if it's a substring 
    // (e.g. they cited 'utils.js' but our chunk is 'src/utils.js')
    let isValid = false;
    for (const validPath of validPaths) {
      if (validPath.includes(cited) || cited.includes(validPath)) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      hallucinations.push(cited);
    }
  }

  return hallucinations;
}

module.exports = {
  extractFilePaths,
  validateCitations
};
