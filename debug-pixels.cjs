require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const userId = 'cc7450ea-ac10-468f-8381-56e4eb3db270';

async function main() {
    const { data, error } = await supabase.from('Accounts').select('Pixels').eq('User ID', userId).maybeSingle();
    console.log('Error:', error);
    console.log('Pixels:', data ? data.Pixels : null);
    if (data && data.Pixels) {
        try {
            const parsed = JSON.parse(data.Pixels);
            console.log('Parsed Pixels:', JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log('Parse error:', e.message);
        }
    } else {
        console.log('No data or pixels field found');
    }
}
main();
