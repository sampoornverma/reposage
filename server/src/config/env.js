const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the .env file located in the server root
// path.join combines directory segments safely across OS platforms
dotenv.config({ path: path.join(__dirname, '../../.env') });

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENROUTER_API_KEY'
];

// Check if any required environment variable is missing or using placeholder values
for (const envVar of requiredEnvVars) {
  const value = process.env[envVar];
  if (!value || value.includes('your-')) {
    console.warn(`[WARNING] Environment variable "${envVar}" is missing or using placeholder values in .env!`);
  }
}

// Export config so that the rest of the application has single-point access to env vars
module.exports = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY
};
