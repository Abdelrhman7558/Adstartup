// Test Add-Campain webhook endpoint
const testAddCampainWebhook = async () => {
    const url = 'https://n8n.srv1181726.hstgr.cloud/webhook-test/Add-Campain';

    console.log('Testing Add-Campain webhook:', url);

    const testPayload = {
        user_id: 'test-user-123',
        campaign_id: 'test-campaign-456',
        campaign_name: 'Test Campaign',
        objective: 'sales',
        goal: 'conversions',
        Currency: 'EGP',
        Daily_Budget: 500,
        Start_time: new Date().toISOString(),
        End_time: null,
        Type: 'assets',
        Page_id: 'test-page',
        timestamp: new Date().toISOString()
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        console.log('Sending payload:', JSON.stringify(testPayload, null, 2));

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('\n✓ Response received!');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);

        const responseText = await response.text();
        console.log('Response Body:', responseText);

        if (response.ok) {
            console.log('\n✓ Add-Campain webhook is working!');
        } else {
            console.log('\n✗ Webhook returned error status');
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('\n✗ Webhook TIMEOUT after 10 seconds');
        } else {
            console.log('\n✗ Error:', error.message);
        }
    }
};

testAddCampainWebhook();
