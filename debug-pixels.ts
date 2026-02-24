import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const userId = 'cc7450ea-ac10-468f-8381-56e4eb3db270';

async function main() {
    const { data, error } = await supabase.from('Accounts').select('Pixels').eq('User ID', userId).maybeSingle();
    console.log('Error:', error);
    console.log('Pixels Raw:', data?.Pixels ? data.Pixels.substring(0, 100) + '...' : null);

    if (data && data.Pixels) {
        try {
            const parsed = JSON.parse(data.Pixels);
            console.log('Parsed Pixels Structure:', Array.isArray(parsed) ? 'Array' : typeof parsed);
            if (Array.isArray(parsed) && parsed.length > 0) {
                console.log('First Pixel Item Keys:', Object.keys(parsed[0]));
                console.log('First Pixel Item:', JSON.stringify(parsed[0], null, 2));
            } else {
                console.log('Parsed Pixels:', parsed);
            }
        } catch (e: any) {
            console.log('Parse error:', e.message);
        }
    } else {
        console.log('No data or pixels field found');
    }
}
main();
