
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAccountsTable() {
    const { data, error } = await supabase
        .from('Accounts')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching from Accounts:', error);
    } else {
        console.log('Accounts table sample data:', JSON.stringify(data, null, 2));
    }
}

checkAccountsTable();
