const fs = require('fs');

async function main() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  let supabaseUrl = '';
  let supabaseKey = '';
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim(); // use service role to bypass RLS
  });

  const headers = { 
    'apikey': supabaseKey, 
    'Authorization': `Bearer ${supabaseKey}` 
  };

  const res = await fetch(`${supabaseUrl}/rest/v1/meta_account_selections?select=*&order=updated_at.desc&limit=5`, { headers });
  const data = await res.json();
  
  if (!Array.isArray(data) || data.length === 0) {
    console.log('No data found or error:', data);
    return;
  }
  
  console.log('--- RECENT CAMPAIGN CREATION LOGS ---');
  for (let row of data) {
      if (row.webhook_response) {
          console.log(`Log [${row.updated_at}]:`);
          console.log(JSON.stringify(row.webhook_response, null, 2));
      }
  }

}

main().catch(console.error);
