import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMetaConnections() {
    console.log('--- Checking ALL FIELDS in meta_connections ---');
    const { data: connections, error: connError } = await supabase      
        .from('meta_connections')
        .select('*')      
        .order('updated_at', { ascending: false })
        .limit(1);      

    if (connError) {
        console.error("Error reading meta_connections:", connError);
    } else {
        console.log("Most recent record in meta_connections:");
        console.log(JSON.stringify(connections, null, 2));
    }
}

checkMetaConnections();
