const dotenv = require('dotenv');
dotenv.config();

const requiredVars = []; 

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(` Missing required env var: ${varName}`);
    process.exit(1);
  }
}

module.exports = {
  port: process.env.PORT || 5000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
};