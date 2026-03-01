
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentErrors() {
    const { data, error } = await supabase
        .from('meta_account_selections')
        .select('user_id, webhook_response, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching from meta_account_selections:', error);
    } else {
        for (const row of data) {
            console.log(`\n================= User: ${row.user_id} | Time: ${row.updated_at} =================`);
            console.log(JSON.stringify(row.webhook_response, null, 2));
        }
    }
}

checkRecentErrors();
