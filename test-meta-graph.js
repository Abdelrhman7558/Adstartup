import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching latest meta_connections...');
  const { data: metaConnections, error: metaError } = await supabase
    .from('meta_connections')
    .select('access_token, catalog_id, user_id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(3);

  if (metaError) {
    console.error('Database Error:', metaError);
    return;
  }
  
  if (!metaConnections || metaConnections.length === 0) {
      console.log('No meta_connections found.');
      return;
  }
  
  const conn = metaConnections[0];
  console.log('Latest Connection:', { user_id: conn.user_id, catalog_id: conn.catalog_id, updated_at: conn.updated_at });
  
  const accessToken = conn.access_token;
  const savedCatalogId = conn.catalog_id;
  
  if (!accessToken) {
      console.log('No access token found.');
      return;
  }
  
  if (savedCatalogId) {
      console.log(`\nFetching specific catalog ${savedCatalogId}...`);
      const res = await fetch(`https://graph.facebook.com/v18.0/${savedCatalogId}?access_token=${accessToken}&fields=id,name`);
      console.log('Status:', res.status, res.statusText);
      const json = await res.json();
      console.log('Response:', JSON.stringify(json, null, 2));
  } else {
      console.log('\nNo catalog_id saved. Proceeding to fetch all businesses...');
  }
  
  let allCatalogs = [];
  let url = `https://graph.facebook.com/v18.0/me/businesses?access_token=${accessToken}&fields=id,name,owned_product_catalogs{id,name,product_count}&limit=100`;

  console.log('\nFetching businesses...');
  while (url) {
    const metaResponse = await fetch(url);
    const metaData = await metaResponse.json();
    console.log('Business Fetch status:', metaResponse.status);
    
    if (!metaResponse.ok) {
        console.log('Business Error:', JSON.stringify(metaData, null, 2));
        break;
    }

    if (metaData.data) {
      metaData.data.forEach((business) => {
        if (business.owned_product_catalogs?.data) {
          allCatalogs.push(...business.owned_product_catalogs.data);
        }
      });
    }
    url = metaData.paging?.next || null;
  }
  
  console.log('All found catalogs:', JSON.stringify(allCatalogs, null, 2));
}

run();
