// Quick test to verify webhook endpoint is responding
const testWebhook = async () => {
    const url = 'https://n8n.srv1181726.hstgr.cloud/webhook-test/Add-Campain';

    console.log('Testing webhook endpoint:', url);
    console.log('Sending test payload...\n');

    const testPayload = {
        user_id: 'test-user-123',
        campaign_name: 'Test Campaign',
        campaign_objective: 'sales',
        target_country: 'EG',
        daily_budget: 500,
        timestamp: new Date().toISOString()
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('✓ Response received!');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);

        const responseText = await response.text();
        console.log('Response Body:', responseText);

        if (response.ok) {
            console.log('\n✓ Webhook is working correctly!');
        } else {
            console.log('\n✗ Webhook returned error status');
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('\n✗ Webhook TIMEOUT after 10 seconds');
            console.log('The webhook endpoint is not responding.');
        } else {
            console.log('\n✗ Error:', error.message);
        }
    }
};

testWebhook();
