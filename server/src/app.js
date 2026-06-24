const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- MIDDLEWARE STACK ---

// 1. Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// 2. Allow cross-origin requests (so React frontend can call this API)
app.use(cors());

// 3. Parse JSON request bodies
app.use(express.json());

// 4. Log every HTTP request to the terminal
app.use(morgan('dev'));

// --- ROUTES ---

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});
// [TEMPORARY] Test routes — we will remove these later
const { cloneRepository, cleanupClone } = require('./services/repoCloner');
const { walkFiles } = require('./services/fileWalker');

app.post('/api/test-clone', async (req, res, next) => {
  try {
    const { githubUrl, branch } = req.body;

    if (!githubUrl) {
      return res.status(400).json({ success: false, error: 'githubUrl is required in the request body' });
    }

    // Step 1: Clone the repo
    const cloneResult = await cloneRepository(githubUrl, branch);

    // Step 2: Walk through files
    const files = walkFiles(cloneResult.localPath);

    // Step 3: Clean up (delete cloned files)
    cleanupClone(cloneResult.localPath);

    // Build a summary of file types found
    const extensionCounts = {};
    for (const file of files) {
      extensionCounts[file.extension] = (extensionCounts[file.extension] || 0) + 1;
    }

    res.status(200).json({
      success: true,
      repoName: cloneResult.repoName,
      totalFilesFound: files.length,
      extensionBreakdown: extensionCounts,
      sampleFiles: files.slice(0, 10).map(f => f.relativePath) // Show first 10 files
    });

  } catch (error) {
    next(error);
  }
});

// --- ERROR HANDLER (must be last) ---
app.use(errorHandler);

module.exports = app;
