import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We need a Personal Access Token (PAT) to query the Management API, not the project anon/service key.
// But we can check if the campaigns actually errored by looking at the DB locally.
async function main() {
    const res = await fetch('https://avzyuhhbmzhxqksnficn.supabase.co/rest/v1/campaigns?select=id,name,status,meta_campaign_id,created_at&order=created_at.desc&limit=3', {
        headers: {
            'apikey': process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`
        }
    });
    const campaigns = await res.json();
    console.log("Recent campaigns:", campaigns);
}
main();
