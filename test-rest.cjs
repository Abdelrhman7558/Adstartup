const fs = require('fs');

async function main() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  let supabaseUrl = '';
  let supabaseKey = '';
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
  });

  const headers = { 
    'apikey': supabaseKey, 
    'Authorization': `Bearer ${supabaseKey}` 
  };

  const res = await fetch(`${supabaseUrl}/rest/v1/meta_connections?select=*&order=updated_at.desc&limit=1`, { headers });
  const data = await res.json();
  
  if (!data || data.length === 0) {
    console.log('No Meta connections found in user database.');
    return;
  }
  
  console.log('--- DATABASE latest meta_connection ---');
  console.log('ad_account_id:', data[0].ad_account_id);
  console.log('page_id:', data[0].page_id);
  console.log('catalog_id:', data[0].catalog_id);
  console.log('is_connected:', data[0].is_connected);

  const accessToken = data[0].access_token;
  const catalogId = data[0].catalog_id;

  if (catalogId) {
    console.log(`\n--- FETCHING CATALOG ${catalogId} ---`);
    const graphRes = await fetch(`https://graph.facebook.com/v18.0/${catalogId}?access_token=${accessToken}&fields=id,name`);
    console.log('Graph Status:', graphRes.status);
    console.log(await graphRes.json());
  } else {
    console.log('\n--- NO CATALOG ID FOUND IN DATABASE ---');
    console.log('This means the user has not selected a catalog during Meta integration, or it failed to save.');
    console.log('Let us try fetching all businesses...');
    let allCatalogs = [];
    let url = `https://graph.facebook.com/v18.0/me/businesses?access_token=${accessToken}&fields=id,name,owned_product_catalogs{id,name,product_count}&limit=100`;

    while (url) {
      const bRes = await fetch(url);
      const bData = await bRes.json();
      if (!bRes.ok) {
        console.log('Error fetching businesses:', bData);
        break;
      }
      if (bData.data) {
        bData.data.forEach((business) => {
          if (business.owned_product_catalogs && business.owned_product_catalogs.data) {
            allCatalogs.push(...business.owned_product_catalogs.data);
          }
        });
      }
      url = bData.paging?.next || null;
    }
    console.log('Catalogs found from businesses Graph request:', allCatalogs);
  }
}

main().catch(console.error);
