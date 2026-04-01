import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

Deno.serve(async (req) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        const { data: selections } = await supabase.from('meta_account_selections').select('*').eq('user_id', 'cc7450ea-ac10-468f-8381-56e4eb3db270');
        const { data: connections } = await supabase.from('meta_connections').select('*').eq('user_id', 'cc7450ea-ac10-468f-8381-56e4eb3db270');

        return new Response(JSON.stringify({ selections, connections }), { headers: { "Content-Type": "application/json" } });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }));
    }
});
