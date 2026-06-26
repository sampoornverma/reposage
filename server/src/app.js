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

const { addIndexingJob, getJobStatus } = require('./jobs/queue');
/**
 * 1. POST /api/index
 * This endpoint no longer runs the heavy indexing pipeline.
 * Instead, it ADDS the job to the Redis queue and returns immediately.
 * The user gets a jobId they can use to poll for progress.
 */
app.post('/api/index', async (req, res, next) => {
  try {
    const { githubUrl, branch } = req.body;

    if (!githubUrl) {
      return res.status(400).json({ success: false, error: 'githubUrl is required' });
    }

    // Add to BullMQ queue instead of running synchronously
    const job = await addIndexingJob({ githubUrl, branch });

    res.status(202).json({
      success: true,
      message: 'Indexing job added to the queue.',
      jobId: job.id
    });

  } catch (error) {
    next(error);
  }
});

/**
 * 2. GET /api/index/status/:jobId
 * The frontend calls this every 2-3 seconds to show a progress bar.
 */
app.get('/api/index/status/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const status = await getJobStatus(jobId);

    if (!status) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    next(error);
  }
});

const { retrieveRelevantContext, generateAnswerStream, generateStrictAnswer } = require('./services/retrievalService');
const { validateCitations } = require('./services/citationValidator');

/**
 * 3. POST /api/chat
 * The main RAG endpoint.
 * Handles both Standard Streaming (with post-validation) and Strict Mode (non-streaming, self-healing).
 */
app.post('/api/chat', async (req, res, next) => {
  try {
    const { question, repositoryId, strictValidation = false } = req.body;

    if (!question || !repositoryId) {
      return res.status(400).json({ success: false, error: 'question and repositoryId are required' });
    }

    // 1. Retrieve top 5 most relevant code chunks
    const chunks = await retrieveRelevantContext(question, repositoryId, 5);

    // --- STRICT MODE (NON-STREAMING) ---
    if (strictValidation) {
      const safeAnswer = await generateStrictAnswer(question, chunks);
      return res.status(200).json({ success: true, data: { text: safeAnswer } });
    }

    // --- STANDARD MODE (STREAMING) ---
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await generateAnswerStream(question, chunks);
    
    // Accumulate the text in memory secretly to validate at the end
    let accumulatedResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        accumulatedResponse += content;
        res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
      }
    }

    // Run Citation Validation on the completed text
    const hallucinations = validateCitations(accumulatedResponse, chunks);
    if (hallucinations.length > 0) {
      res.write(`data: ${JSON.stringify({ 
        type: 'hallucination_warning', 
        invalidFiles: hallucinations 
      })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'An error occurred during generation' })}\n\n`);
      res.end();
    } else {
      next(error);
    }
  }
});

// --- ERROR HANDLER (must be last) ---
app.use(errorHandler);

module.exports = app;
