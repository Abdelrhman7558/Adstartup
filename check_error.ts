import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const supabase = createClient(
    'https://avzyuhhbmzhxqksnficn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2enl1aGhibXpoeHFrc25maWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTE4OTQsImV4cCI6MjA3OTM2Nzg5NH0.agjZAJJex4Zo_m0mQL6TUfe6d-VHhbuSJe8f7IXg0ck'
);

async function main() {
    const { data, error } = await supabase
        .from('meta_account_selections')
        .select('webhook_response')
        .order('updated_at', { ascending: false })
        .limit(2);

    if (error) console.error("Error fetching:", error);
    else console.log(JSON.stringify(data, null, 2));
}

main();
