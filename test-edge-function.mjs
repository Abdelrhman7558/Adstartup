// Test the create-meta-campaign edge function directly
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://avzyuhhbmzhxqksnficn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2enl1aGhibXpoeHFrc25maWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTE4OTQsImV4cCI6MjA3OTM2Nzg5NH0.agjZAJJex4Zo_m0mQL6TUfe6d-VHhbuSJe8f7IXg0ck';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    // First, let's check if we can call the function at all with a minimal payload
    // This will test if the function crashes or returns a proper error

    console.log('--- Test 1: Call function without auth (should get Missing Authorization header) ---');
    try {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/create-meta-campaign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ test: true }),
        });
        console.log('Status:', resp.status);
        console.log('Status text:', resp.statusText);
        const text = await resp.text();
        console.log('Response body:', text);
    } catch (err) {
        console.error('Error:', err.message);
    }

    console.log('\n--- Test 2: Call function with anon key as bearer token ---');
    try {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/create-meta-campaign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ test: true }),
        });
        console.log('Status:', resp.status);
        console.log('Status text:', resp.statusText);
        const text = await resp.text();
        console.log('Response body:', text);
    } catch (err) {
        console.error('Error:', err.message);
    }

    console.log('\n--- Test 3: Call via supabase SDK ---');
    try {
        const { data, error } = await supabase.functions.invoke('create-meta-campaign', {
            body: { test: true },
        });
        console.log('Data:', JSON.stringify(data, null, 2));
        console.log('Error:', error ? JSON.stringify(error, null, 2) : 'none');
    } catch (err) {
        console.error('Exception:', err.message);
        console.error('Full error:', JSON.stringify(err, null, 2));
    }
}

test().catch(console.error);
