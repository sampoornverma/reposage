/**
 * AST-Aware Chunker (Advanced Strategy)
 * Uses Tree-sitter to parse JavaScript/JSX/TypeScript code into an Abstract Syntax Tree (AST).
 * It extracts classes, functions, and methods as logical units.
 * Falls back to naive chunking if a block is too large or if no AST declarations are found.
 */

const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');
const Python = require('tree-sitter-python');
const path = require('path');
const { chunkFileNaive } = require('./naiveChunker');

// Initialize the parser
const parser = new Parser();

// Node types we consider as logical code units (for both JS and Python)
const DECLARATION_NODE_TYPES = new Set([
  // JavaScript / TypeScript
  'function_declaration',
  'class_declaration',
  'method_definition',
  'arrow_function',
  // Python
  'function_definition',
  'class_definition'
]);

/**
 * Recursively walks the AST to find function and class declaration nodes
 * @param {Object} node - Current Tree-sitter node
 * @param {Array<Object>} declarations - Array to collect declarations
 */
function findDeclarations(node, declarations = []) {
  if (DECLARATION_NODE_TYPES.has(node.type)) {
    declarations.push(node);
  }

  // Traverse children
  for (let i = 0; i < node.childCount; i++) {
    findDeclarations(node.child(i), declarations);
  }

  return declarations;
}

/**
 * Splits file content into chunks using AST parsing.
 * @param {string} content - Full source code of the file.
 * @param {string} filePath - Path to the file.
 * @param {Object} options - Chunking options.
 * @param {number} options.maxLinesPerChunk - Maximum lines allowed per chunk (default: 60).
 * @returns {Array<Object>} Array of chunk objects.
 */
function chunkFileAST(content, filePath, options = {}) {
  const maxLinesPerChunk = options.maxLinesPerChunk || 60;
  
  // Dynamically set grammar based on file extension
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.py') {
    parser.setLanguage(Python);
  } else {
    parser.setLanguage(JavaScript);
  }
  
  const lines = content.split(/\r?\n/);
  const totalLines = lines.length;

  let tree;
  try {
    tree = parser.parse(content);
  } catch (parseError) {
    console.warn(`[AST CHUNKER] ⚠️ Parsing failed for ${filePath}, falling back to naive.`, parseError.message);
    return chunkFileNaive(content, filePath, options);
  }

  const rootNode = tree.rootNode;
  
  // Find all code structures (functions, classes, methods)
  const declarations = findDeclarations(rootNode);

  // If no classes or functions are found (e.g. a config file or simple constants),
  // fall back to the naive chunker
  if (declarations.length === 0) {
    return chunkFileNaive(content, filePath, options);
  }

  const chunks = [];
  const processedLines = new Set();

  for (const node of declarations) {
    const startLine = node.startPosition.row + 1; // 1-indexed
    const endLine = node.endPosition.row + 1;
    const nodeLinesCount = endLine - startLine + 1;

    // Check if this line range overlaps significantly with already processed declarations
    // (e.g., method_definition inside a class_declaration)
    let isSubset = false;
    for (let line = startLine; line <= endLine; line++) {
      if (processedLines.has(line)) {
        isSubset = true;
        break;
      }
    }
    if (isSubset) continue; // Skip inner methods if class was already processed

    const nodeContent = lines.slice(startLine - 1, endLine).join('\n');

    // If the logical unit is too large, split it naively
    if (nodeLinesCount > maxLinesPerChunk) {
      const subChunks = chunkFileNaive(nodeContent, filePath, {
        chunkSize: maxLinesPerChunk,
        overlap: Math.floor(maxLinesPerChunk * 0.2)
      });
      // Adjust start/end lines of subchunks relative to the parent file
      for (const sub of subChunks) {
        sub.startLine = startLine + sub.startLine - 1;
        sub.endLine = startLine + sub.endLine - 1;
        sub.type = 'ast-subchunk';
        chunks.push(sub);
      }
    } else {
      chunks.push({
        content: nodeContent,
        filePath: filePath,
        startLine: startLine,
        endLine: endLine,
        type: 'ast',
        nodeType: node.type
      });
    }

    // Mark lines as processed
    for (let line = startLine; line <= endLine; line++) {
      processedLines.add(line);
    }
  }

  // Gather any skipped top-level lines (loose code, imports, variable declarations not inside functions)
  // and chunk them naively so no code is left behind
  let looseStart = null;
  for (let line = 1; line <= totalLines; line++) {
    if (!processedLines.has(line)) {
      if (looseStart === null) {
        looseStart = line;
      }
    } else {
      if (looseStart !== null) {
        addLooseChunk(looseStart, line - 1);
        looseStart = null;
      }
    }
  }
  if (looseStart !== null) {
    addLooseChunk(looseStart, totalLines);
  }

  function addLooseChunk(start, end) {
    const looseLinesCount = end - start + 1;
    const looseContent = lines.slice(start - 1, end).join('\n');
    
    if (looseLinesCount > maxLinesPerChunk) {
      const subChunks = chunkFileNaive(looseContent, filePath, {
        chunkSize: maxLinesPerChunk,
        overlap: Math.floor(maxLinesPerChunk * 0.2)
      });
      for (const sub of subChunks) {
        sub.startLine = start + sub.startLine - 1;
        sub.endLine = start + sub.endLine - 1;
        sub.type = 'ast-loose-subchunk';
        chunks.push(sub);
      }
    } else {
      chunks.push({
        content: looseContent,
        filePath: filePath,
        startLine: start,
        endLine: end,
        type: 'ast-loose'
      });
    }
  }

  // Sort chunks by startLine to keep them in order of the file
  return chunks.sort((a, b) => a.startLine - b.startLine);
}

module.exports = {
  chunkFileAST
};
