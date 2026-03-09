import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    const { data: cols1, error: err1 } = await supabase.rpc('query_columns', { table_name: 'meta_connections' });
    if (err1) {
        // try direct SQL if rpc not available
        const { data: q1, error: qe1 } = await supabase.from('meta_connections').select('*').limit(1);
        console.log('meta_connections fields (if any row exists):', q1?.[0] ? Object.keys(q1[0]) : 'No rows');

        // just try inserting a dummy row and logging the error
        const { error: insErr1 } = await supabase.from('meta_connections').insert({ user_id: '00000000-0000-0000-0000-000000000000' });
        console.log('meta_connections insert error format:', insErr1);
    }

    const { data: q2, error: qe2 } = await supabase.from('meta_account_selections').select('*').limit(1);
    console.log('meta_account_selections fields:', q2?.[0] ? Object.keys(q2[0]) : 'No rows');

    const { error: insErr2 } = await supabase.from('meta_account_selections').insert({ user_id: '00000000-0000-0000-0000-000000000000' });
    console.log('meta_account_selections insert error format:', insErr2);
}

checkSchema();
