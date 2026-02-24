// Read debug data from meta_account_selections table
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2enl1aGhibXpoeHFrc25maWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTE4OTQsImV4cCI6MjA3OTM2Nzg5NH0.agjZAJJex4Zo_m0mQL6TUfe6d-VHhbuSJe8f7IXg0ck';
const baseUrl = 'https://avzyuhhbmzhxqksnficn.supabase.co/rest/v1';

async function main() {
    console.log("=== Debug Data from meta_account_selections ===");
    const url = `${baseUrl}/meta_account_selections?select=user_id,webhook_response,updated_at&order=updated_at.desc&limit=5`;
    const res = await fetch(url, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
