import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: conns } = await supabase.from('meta_connections').select('*');
    console.log("meta_connections total count:", conns?.length);
    if (conns?.length > 0) {
        console.log("Recent connections:", conns.slice(-3).map(c => ({ id: c.id, uid: c.user_id, token: c.access_token?.substring(0, 10) })));
    }
}
check();
