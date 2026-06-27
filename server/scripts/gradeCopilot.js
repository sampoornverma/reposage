const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const judgeAi = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

async function gradeCopilot() {
  console.log("🚀 PHASE 3: Running Automated Judge on GitHub Copilot Answers\n");

  const datasetPath = path.resolve(__dirname, '../reposage_advantage_dataset.json');
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

  const copilotAnswersPath = path.resolve(__dirname, '../copilot_answers.json');
  const copilotAnswers = JSON.parse(fs.readFileSync(copilotAnswersPath, 'utf-8'));

  let totalScore = 0;

  for (let i = 0; i < dataset.length; i++) {
    const test = dataset[i];
    const copilotAnswer = copilotAnswers[i];
    
    console.log(`[Q${i+1}] ${test.question}`);
    console.log(`🤖 Copilot: "${copilotAnswer.substring(0, 100)}..."`);

    const judgePrompt = `
      You are a strict technical judge. Score the following answer from 1 to 5 based on how well it matches the EXPECTED ANSWER.
      
      QUESTION: ${test.question}
      EXPECTED ANSWER: ${test.expected_answer}
      
      COPILOT'S ANSWER: ${copilotAnswer}
      
      Reply with ONLY a number between 1 and 5.
    `;

    const judgeResponse = await judgeAi.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: judgePrompt }],
    });

    const score = parseInt(judgeResponse.choices[0].message.content.trim()) || 1;
    console.log(`⚖️  Judge Score: ${score}/5\n`);
    totalScore += score;
  }

  const average = totalScore / dataset.length;
  console.log(`=========================================`);
  console.log(`🎉 PHASE 3 COMPLETE: Copilot Average Score: ${average}/5`);
  console.log(`=========================================`);
}

gradeCopilot();
