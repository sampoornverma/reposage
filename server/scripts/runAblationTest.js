const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const judgeAi = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

async function askRepoSage(question, mode) {
  const response = await fetch('http://localhost:3001/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: question,
      repositoryId: '411d7a2a-9ef5-4c51-aa46-52c384211d00',
      strictValidation: true,
      ablationMode: mode
    })
  });
  
  if (!response.ok) return "Error fetching response.";
  const data = await response.json();
  return data.data?.text || "No response.";
}

async function gradeAnswer(question, expected, actual) {
  const judgePrompt = `
    Score this answer from 1 to 5 based on factual accuracy.
    QUESTION: ${question}
    EXPECTED ANSWER: ${expected}
    ACTUAL ANSWER: ${actual}
    Reply with ONLY a number between 1 and 5.
  `;
  const res = await judgeAi.chat.completions.create({
    model: 'openai/gpt-4o-mini',
    messages: [{ role: 'user', content: judgePrompt }],
  });
  return parseInt(res.choices[0].message.content.trim()) || 1;
}

async function runAblationTest() {
  console.log("🔬 Running Ablation Test: Hybrid (RRF) vs. Pure Semantic Search");
  console.log("Testing on the first 5 tricky questions...\n");

  const datasetPath = path.resolve(__dirname, '../eval_dataset.json');
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8')).slice(0, 5); // Just 5 for a quick test

  let semanticScore = 0;
  let hybridScore = 0;

  for (let i = 0; i < dataset.length; i++) {
    const test = dataset[i];
    console.log(`[Q${i+1}] ${test.question}`);

    // 1. Semantic Mode
    const semanticAns = await askRepoSage(test.question, 'semantic');
    const sScore = await gradeAnswer(test.question, test.expected_answer, semanticAns);
    semanticScore += sScore;
    console.log(`   🟡 Semantic Only Score: ${sScore}/5`);
    await new Promise(r => setTimeout(r, 1500));

    // 2. Hybrid Mode
    const hybridAns = await askRepoSage(test.question, 'hybrid');
    const hScore = await gradeAnswer(test.question, test.expected_answer, hybridAns);
    hybridScore += hScore;
    console.log(`   🟢 Hybrid (RRF) Score: ${hScore}/5\n`);
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`=========================================`);
  console.log(`📊 FINAL ABLATION RESULTS (Out of 25 possible points)`);
  console.log(`🟡 Semantic Search Only: ${semanticScore}/25`);
  console.log(`🟢 Hybrid Search (RRF): ${hybridScore}/25`);
  console.log(`=========================================`);
}

runAblationTest();
