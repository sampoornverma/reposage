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
// [TEMPORARY] Test route — full indexing pipeline
const { indexRepository } = require('./services/indexingPipeline');

app.post('/api/index', async (req, res, next) => {
  try {
    const { githubUrl, branch } = req.body;

    if (!githubUrl) {
      return res.status(400).json({ success: false, error: 'githubUrl is required' });
    }

    // Run the full pipeline: clone → walk → chunk → embed → save
    const result = await indexRepository(githubUrl, branch);

    res.status(200).json({
      success: true,
      message: `✅ Successfully indexed "${result.repoName}"!`,
      data: result
    });

  } catch (error) {
    next(error);
  }
});

// --- ERROR HANDLER (must be last) ---
app.use(errorHandler);

module.exports = app;
