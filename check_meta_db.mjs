import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || supabaseKey);

async function checkMetaConnections() {
    console.log('--- Checking meta_connections ---');
    const { data: connections, error: connError } = await supabase
        .from('meta_connections')
        .select('user_id, access_token, connected_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);

    if (connError) console.error("Error reading meta_connections:", connError);
    else console.log(JSON.stringify(connections, null, 2));

    console.log('\n--- Checking meta_account_selections ---');
    const { data: selections, error: selError } = await supabase
        .from('meta_account_selections')
        .select('user_id, selection_completed, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);

    if (selError) console.error("Error reading meta_account_selections:", selError);
    else console.log(JSON.stringify(selections, null, 2));
}

checkMetaConnections();
