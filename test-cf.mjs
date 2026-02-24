const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2enl1aGhibXpoeHFrc25maWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTE4OTQsImV4cCI6MjA3OTM2Nzg5NH0.agjZAJJex4Zo_m0mQL6TUfe6d-VHhbuSJe8f7IXg0ck';
const url = 'https://avzyuhhbmzhxqksnficn.supabase.co/functions/v1/create-meta-campaign';

async function main() {
    const payload = {
        user_id: "cc7450ea-ac10-468f-8381-56e4eb3db270",
        campaign_id: "test",
        campaign_name: "test",
        objective: "sales",
        goal: "increase sales",
        daily_budget: 500,
        currency: "EGP",
        start_time: "2024-03-24T12:00:00.000Z",
        end_time: null,
        description: "test",
        offer: null,
        meta_connection: {
            ad_account_id: "act_123",
            pixel_id: null,
            catalog_id: null,
            catalog_name: null,
            page_id: null,
            page_name: null,
            access_token: "test"
        },
        brief: {},
        asset_type: "upload",
        assets: [],
        catalog_id: null,
        catalog_name: null,
        page_id: null,
        page_name: null,
        account_id: null,
        account_name: null,
        agent_mode: "TEST",
        timestamp: "2024-03-24T12:00:00.000Z"
    };

    console.log("Sending payload...");
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify(payload)
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text);
}
main();
