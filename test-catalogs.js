const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('meta_connections').select('*').limit(5).order('updated_at', {ascending:false});
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('meta_connections latest rows:\n', JSON.stringify(data, null, 2));
  }
}
run();
