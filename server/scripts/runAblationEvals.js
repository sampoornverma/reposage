const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Load environment variables correctly
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const judgeAi = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

async function runAblationEvals() {
  console.log("🚀 PHASE 4: Ablation Test (Pure Semantic Search vs Hybrid)\n");

  // Load the tough advantage dataset
  const datasetPath = path.resolve(__dirname, '../reposage_advantage_dataset.json');
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

  let totalScore = 0;

  for (let i = 0; i < dataset.length; i++) {
    const test = dataset[i];
    console.log(`[Q${i+1}] ${test.question}`);
    
    try {
      // Fetch RepoSage's Answer using STRICTLY SEMANTIC search (no RRF)
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: test.question,
          repositoryId: '411d7a2a-9ef5-4c51-aa46-52c384211d00',
          strictValidation: true,
          ablationMode: 'semantic' // <--- THIS TURNS OFF KEYWORD SEARCH
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const reposageAnswer = data.data?.text || "No response.";
      console.log(`🤖 RepoSage (Semantic Only): "${reposageAnswer.substring(0, 100)}..."`);

      // Ask GPT-4o-mini to act as the "Judge LLM"
      const judgePrompt = `
        You are a strict technical judge. Score the following answer from 1 to 5 based on how well it matches the EXPECTED ANSWER.
        If it completely hallucinated or said 'No relevant code found', score it a 1.
        
        QUESTION: ${test.question}
        EXPECTED ANSWER: ${test.expected_answer}
        
        REPOSAGE'S ANSWER: ${reposageAnswer}
        
        Reply with ONLY a number between 1 and 5.
      `;

      const judgeResponse = await judgeAi.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: judgePrompt }],
      });

      const score = parseInt(judgeResponse.choices[0].message.content.trim()) || 1;
      console.log(`⚖️  Judge Score: ${score}/5\n`);
      totalScore += score;
    } catch (error) {
      console.log(`❌ Error processing Q${i+1}: ${error.message}`);
      console.log(`⚖️  Judge Score: 1/5 (Failed to connect)\n`);
      totalScore += 1;
    }

    // Add a 2-second delay to prevent rate-limiting OpenRouter
    await new Promise(r => setTimeout(r, 2000));
  }

  const average = totalScore / dataset.length;
  console.log(`=========================================`);
  console.log(`📉 ABLATION COMPLETE: Semantic-Only Score: ${average}/5`);
  console.log(`=========================================`);
  console.log(`Compare this to your Hybrid Score of 4.7/5!`);
}

runAblationEvals();
