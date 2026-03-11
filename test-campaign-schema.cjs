const fs = require('fs');

async function main() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  let supabaseUrl = '';
  let supabaseKey = '';
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim(); 
  });

  const headers = { 
    'apikey': supabaseKey, 
    'Authorization': `Bearer ${supabaseKey}` 
  };

  const res = await fetch(`${supabaseUrl}/rest/v1/campaigns?select=*&limit=1`, { headers });
  const data = await res.json();
  console.log(JSON.stringify(data[0], null, 2));

}

main().catch(console.error);
