const https = require('https');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', reject).end();
  });
}

async function run() {
  console.log('Fetching meta_connections...');
  const url = `${SUPABASE_URL}/rest/v1/meta_connections?select=access_token,catalog_id,user_id,updated_at&order=updated_at.desc&limit=1`;
  const { status, data } = await fetchJson(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  
  console.log('DB Status:', status);
  if (data && data.length > 0) {
    const conn = data[0];
    console.log('Latest Connection:', { user_id: conn.user_id, catalog_id: conn.catalog_id });
    
    if (conn.catalog_id) {
        console.log(`\nFetching catalog ${conn.catalog_id} from Graph...`);
        const graphUrl = `https://graph.facebook.com/v18.0/${conn.catalog_id}?access_token=${conn.access_token}&fields=id,name`;
        const res = await fetchJson(graphUrl);
        console.log('Graph Response:', res.status, JSON.stringify(res.data, null, 2));
    } else {
        console.log('\nNo catalog_id found in the user record.');
    }
  } else {
    console.log('No recent connections found.', data);
  }
}

run();
