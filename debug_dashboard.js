
const MAIN_DATA_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook/other-data';
const RECENT_CAMPAIGNS_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook-test/Recently-campaign';
const SALES_TREND_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook-test/sales-trend';
const USER_ID = '0b599f60-7080-4e2b-8873-10d486aa7926'; // Using a placeholder or I should try to get a real one. I will use a dummy one for now, or if I can see the user ID in the logs I would use that. 
// Given the context, I'll use a likely valid-looking dummy or just check if the endpoint fails without a valid user. 
// Actually, looking at previous logs, I see valid user IDs passed. I'll rely on the user confirming context or just try with a generic structure.
// Wait, the previous logs had `user.id`. The user is authenticated. 
// I will try to fetch without a specific user ID first to see if I get a 400 or generic data, or just use a dummy UUID.

async function testWebhooks() {
    const fetchSafe = async (url, label) => {
        try {
            console.log(`Fetching ${label}...`);
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: 'test-user-id' })
            });
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            const json = await res.json();
            console.log(`[${label}] SUCCESS`);
            console.log(JSON.stringify(json, null, 2).slice(0, 500) + '...'); // Log first 500 chars
        } catch (err) {
            console.error(`[${label}] FAILED:`, err.message);
        }
    };

    await Promise.all([
        fetchSafe(MAIN_DATA_URL, 'Main Data'),
        fetchSafe(RECENT_CAMPAIGNS_URL, 'Recent Campaigns'),
        fetchSafe(SALES_TREND_URL, 'Sales Trend'),
    ]);
}

testWebhooks();
