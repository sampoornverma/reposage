const fs = require('fs');
const path = require('path');

// File extensions we WANT to analyze (actual code and documentation)
const ALLOWED_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx',   // JavaScript / TypeScript
  '.py',                           // Python
  '.java',                         // Java
  '.go',                           // Go
  '.rs',                           // Rust
  '.c', '.cpp', '.h',             // C / C++
  '.rb',                           // Ruby
  '.php',                          // PHP
  '.css', '.scss',                 // Stylesheets
  '.html',                         // HTML
  '.json',                         // Config files (package.json, tsconfig, etc.)
  '.md',                           // Documentation (README, CONTRIBUTING, etc.)
  '.yaml', '.yml',                 // Config files (docker-compose, CI/CD, etc.)
  '.sql',                          // Database schemas
  '.sh',                           // Shell scripts
  '.env.example'                   // Environment templates
]);

// Directories we NEVER want to enter (irrelevant or massive)
const BLOCKED_DIRECTORIES = new Set([
  'node_modules',    // npm dependencies (thousands of files we didn't write)
  '.git',            // Git internal data (commit history, refs, objects)
  'dist',            // Compiled/built output
  'build',           // Compiled/built output
  '.next',           // Next.js build cache
  'coverage',        // Test coverage reports
  '__pycache__',     // Python bytecode cache
  '.venv', 'venv',   // Python virtual environments
  'vendor',          // Go/PHP dependencies
  '.idea', '.vscode' // IDE config folders
]);

// Files we skip even if they have allowed extensions
const BLOCKED_FILES = new Set([
  'package-lock.json',  // npm lock file (huge, auto-generated, no useful info)
  'yarn.lock',          // Yarn lock file
  'pnpm-lock.yaml',     // pnpm lock file
  '.DS_Store'           // macOS hidden file
]);

// Maximum file size we will process (500KB)
// Files larger than this are likely auto-generated or minified bundles
const MAX_FILE_SIZE = 500 * 1024;

/**
 * Recursively walks a directory tree and returns all code files worth analyzing.
 *
 * @param {string} rootDir - The root directory of the cloned repository
 * @returns {Array} - Array of file objects: { absolutePath, relativePath, extension, sizeBytes }
 */
function walkFiles(rootDir) {
  const results = [];

  // Inner recursive function that digs into each subfolder
  function walk(currentDir) {
    // fs.readdirSync reads all items (files + folders) in a directory
    // { withFileTypes: true } returns Dirent objects that tell us if each item is a file or folder
    const items = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);

      if (item.isDirectory()) {
        // SKIP blocked directories entirely (don't even look inside them)
        if (BLOCKED_DIRECTORIES.has(item.name)) {
          continue; // "continue" skips to the next iteration of the for loop
        }
        // If the directory is allowed, recurse into it
        walk(fullPath);

      } else if (item.isFile()) {
        // Skip blocked files
        if (BLOCKED_FILES.has(item.name)) {
          continue;
        }

        const extension = path.extname(item.name).toLowerCase(); // ".js", ".py", etc.

        // Skip files with extensions we don't care about
        if (!ALLOWED_EXTENSIONS.has(extension)) {
          continue;
        }

        // Check file size — skip files that are too large (likely auto-generated)
        const stats = fs.statSync(fullPath);
        if (stats.size > MAX_FILE_SIZE) {
          console.log(`[WALKER] ⚠️  Skipping large file (${(stats.size / 1024).toFixed(0)}KB): ${item.name}`);
          continue;
        }

        // Skip empty files (0 bytes = nothing to analyze)
        if (stats.size === 0) {
          continue;
        }

        // This file passed ALL filters — add it to results
        results.push({
          absolutePath: fullPath,
          relativePath: path.relative(rootDir, fullPath), // "src/config/env.js" instead of full path
          extension: extension,
          sizeBytes: stats.size
        });
      }
    }
  }

  // Start the recursive walk from the root
  walk(rootDir);

  console.log(`[WALKER] 📂 Found ${results.length} code files to process`);
  return results;
}

module.exports = { walkFiles };
