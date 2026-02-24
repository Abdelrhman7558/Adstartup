const url = 'https://avzyuhhbmzhxqksnficn.supabase.co/rest/v1/Accounts?User%20ID=eq.cc7450ea-ac10-468f-8381-56e4eb3db270&select=Pixels';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2enl1aGhibXpoeHFrc25maWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTE4OTQsImV4cCI6MjA3OTM2Nzg5NH0.agjZAJJex4Zo_m0mQL6TUfe6d-VHhbuSJe8f7IXg0ck';

async function main() {
    try {
        const res = await fetch(url, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        const data = await res.json();
        if (data && data.length > 0 && data[0].Pixels) {
            console.log('Pixels:', JSON.stringify(data[0].Pixels, null, 2));
        } else {
            console.log('No data or pixels field found');
        }
    } catch (err) {
        console.error(err);
    }
}
main();
