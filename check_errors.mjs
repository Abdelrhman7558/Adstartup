
import dotenv from 'dotenv';
dotenv.config();

const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/meta_account_selections?select=user_id,webhook_response,updated_at&order=updated_at.desc&limit=5`;
const key = process.env.VITE_SUPABASE_ANON_KEY;

async function check() {
    const res = await fetch(url, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });

    if (!res.ok) {
        console.error('Fetch error:', await res.text());
        return;
    }
    const data = await res.json();
    for (const row of data) {
        console.log(`\n================= User: ${row.user_id} | Time: ${row.updated_at} =================`);
        console.log(JSON.stringify(row.webhook_response, null, 2));
    }
}
check();
