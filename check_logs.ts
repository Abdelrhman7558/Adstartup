
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLogs() {
    const { data, error } = await supabase
        .from('meta_account_selections')
        .select('webhook_response, updated_at')
        .not('webhook_response', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching logs:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('--- LATEST LOG ---');
        console.log('Timestamp:', data[0].updated_at);
        console.log(JSON.stringify(data[0].webhook_response, null, 2));
    } else {
        console.log('No logs found.');
    }
}

checkLogs();
