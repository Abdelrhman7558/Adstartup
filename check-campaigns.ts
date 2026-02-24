import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supa = createClient(supabaseUrl, serviceKey);

async function main() {
    // There isn't a direct endpoint for edge function logs in supabase-js, so let's check if the campaign reached the DB instead.
    const { data: campaigns } = await supa.from('campaigns').select('*').order('created_at', { ascending: false }).limit(2);
    console.log("Recent campaigns:", campaigns?.map(c => ({ id: c.id, status: c.status, name: c.name, meta_campaign_id: c.meta_campaign_id })));
}
main();
