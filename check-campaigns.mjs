const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2enl1aGhibXpoeHFrc25maWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTE4OTQsImV4cCI6MjA3OTM2Nzg5NH0.agjZAJJex4Zo_m0mQL6TUfe6d-VHhbuSJe8f7IXg0ck';
const baseUrl = 'https://avzyuhhbmzhxqksnficn.supabase.co/rest/v1';

async function fetchTable(table, queryParams) {
    const url = `${baseUrl}/${table}?${queryParams}`;
    const res = await fetch(url, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });
    return await res.json();
}

async function main() {
    try {
        console.log("Recent campaigns...");
        const campaigns = await fetchTable('campaigns', `select=id,name,status,meta_campaign_id,created_at&order=created_at.desc&limit=3`);
        console.log("Recent campaigns:", campaigns);

    } catch (e) {
        console.error(e);
    }
}
main();
