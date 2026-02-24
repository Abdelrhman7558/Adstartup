const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2enl1aGhibXpoeHFrc25maWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTE4OTQsImV4cCI6MjA3OTM2Nzg5NH0.agjZAJJex4Zo_m0mQL6TUfe6d-VHhbuSJe8f7IXg0ck';
const baseUrl = 'https://avzyuhhbmzhxqksnficn.supabase.co/rest/v1';

async function main() {
    try {
        console.log("Checking errors in manager_meta_accounts...");
        const res = await fetch(`${baseUrl}/manager_meta_accounts?select=user_id,id,webhook_response&order=created_at.desc&limit=10`, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        const data = await res.json();

        console.log("Raw manager accounts:", data);

        console.log("Checking errors in meta_account_selections...");
        const res2 = await fetch(`${baseUrl}/meta_account_selections?select=user_id,webhook_response&order=updated_at.desc&limit=10`, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        const data2 = await res2.json();
        console.log("Raw selections:", data2);

    } catch (e) {
        console.error(e);
    }
}
main();
