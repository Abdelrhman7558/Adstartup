// Test Meta API connection directly
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
        // 1. Get meta_connections data
        console.log("=== Meta Connections ===");
        const connections = await fetchTable('meta_connections', 'select=*&limit=5');
        for (const conn of connections) {
            console.log({
                user_id: conn.user_id,
                ad_account_id: conn.ad_account_id,
                pixel_id: conn.pixel_id,
                page_id: conn.page_id,
                page_name: conn.page_name,
                is_connected: conn.is_connected,
                has_access_token: !!conn.access_token,
                access_token_prefix: conn.access_token ? conn.access_token.substring(0, 20) + '...' : 'NONE',
            });

            // 2. Try calling Meta API directly to verify the token works
            if (conn.access_token && conn.ad_account_id) {
                const adAccountId = conn.ad_account_id.startsWith('act_')
                    ? conn.ad_account_id
                    : `act_${conn.ad_account_id}`;

                console.log(`\n=== Testing Meta API for account: ${adAccountId} ===`);

                // Test basic API call - get ad account info
                const testUrl = `https://graph.facebook.com/v21.0/${adAccountId}?access_token=${conn.access_token}&fields=name,account_status,currency,business_name`;
                try {
                    const testResp = await fetch(testUrl);
                    const testData = await testResp.json();
                    console.log("Account Info:", JSON.stringify(testData, null, 2));
                } catch (e) {
                    console.error("Account Info Error:", e.message);
                }

                // Test campaign creation with minimal params
                console.log(`\n=== Testing campaign creation on ${adAccountId} ===`);
                const createUrl = `https://graph.facebook.com/v21.0/${adAccountId}/campaigns`;
                const params = new URLSearchParams();
                params.append('access_token', conn.access_token);
                params.append('name', 'API Test Campaign DELETE ME');
                params.append('objective', 'OUTCOME_SALES');
                params.append('status', 'PAUSED');
                params.append('special_ad_categories', '[]');

                console.log("Request body:", params.toString().replace(/access_token=[^&]+/, 'access_token=***'));

                try {
                    const createResp = await fetch(createUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: params.toString(),
                    });
                    const createData = await createResp.json();
                    console.log("Campaign Creation Response Status:", createResp.status);
                    console.log("Campaign Creation Response:", JSON.stringify(createData, null, 2));

                    // If campaign was created, delete it
                    if (createData.id) {
                        console.log("Cleaning up - deleting test campaign:", createData.id);
                        const deleteUrl = `https://graph.facebook.com/v21.0/${createData.id}?access_token=${conn.access_token}`;
                        await fetch(deleteUrl, { method: 'DELETE' });
                    }
                } catch (e) {
                    console.error("Campaign Creation Exception:", e.message);
                }
            }
        }

        // 3. Get recent campaigns to see what data the frontend sends
        console.log("\n=== Recent Campaigns (from DB) ===");
        const campaigns = await fetchTable('campaigns', 'select=*&order=created_at.desc&limit=3');
        for (const c of campaigns) {
            console.log({
                id: c.id,
                name: c.name,
                objective: c.objective,
                status: c.status,
                meta_campaign_id: c.meta_campaign_id,
                budget: c.budget,
                page_id: c.page_id,
                created_at: c.created_at,
            });
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
