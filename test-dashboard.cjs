const fs = require('fs');

async function main() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  let supabaseUrl = '';
  let supabaseKey = '';
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim(); 
  });

  const headers = { 
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };

  const res = await fetch(`${supabaseUrl}/functions/v1/get-user-dashboard-data`, { 
    method: 'GET',
    headers 
  });
  const data = await res.json();
  
  const campaigns = data.recent_campaigns || [];
  if (campaigns.length > 0) {
    console.log('Recent campaigns metadata:');
    campaigns.forEach((c, idx) => {
        console.log(`[${idx}] ${c.name} - Thumbnail: ${c.thumbnail}`);
    });
  } else {
    console.log('No recent campaigns returned.');
    console.log('Raw result:', JSON.stringify(data, null, 2).substring(0, 500));
  }
}

main().catch(console.error);
