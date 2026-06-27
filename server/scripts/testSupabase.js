const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: new Array(1536).fill(0),
    query_text: '',
    match_count: 1,
    repo_id: '411d7a2a-9ef5-4c51-aa46-52c384211d00'
  });
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
