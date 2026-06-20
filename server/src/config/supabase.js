const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in your .env file!');
}

// Initialize the Supabase client
// We use the service_role key here because this is a backend service. 
// It needs superuser credentials to read/write all repositories, bypass RLS, and generate embeddings.
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false, // Disables local storage session caching (we are on a server, not a browser)
    autoRefreshToken: false // No need to auto-refresh tokens for server-to-server operations
  }
});

module.exports = { supabase };
