
const url = "https://avzyuhhbmzhxqksnficn.supabase.co/rest/v1/meta_account_selections?select=user_id,webhook_response,updated_at&order=updated_at.desc&limit=1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2enl1aGhibXpoeHFrc25maWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTE4OTQsImV4cCI6MjA3OTM2Nzg5NH0.agjZAJJex4Zo_m0mQL6TUfe6d-VHhbuSJe8f7IXg0ck";

const r = await fetch(url, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } });
const data = await r.json();
data.forEach(row => {
    console.log(`\n=== User: ${row.user_id} | Time: ${row.updated_at} ===`);
    console.log(JSON.stringify(row.webhook_response, null, 2));
});
