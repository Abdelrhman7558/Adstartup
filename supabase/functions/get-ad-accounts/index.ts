import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Get ALL available tokens for the user
    const [metaConnectionsResult, metaSelectionsResult] = await Promise.all([
      supabase
        .from('meta_connections')
        .select('access_token')
        .eq('user_id', user.id),
      supabase
        .from('meta_account_selections')
        .select('access_token')
        .eq('user_id', user.id)
    ]);

    // 2. Extract unique tokens
    const tokens = new Set<string>();
    (metaConnectionsResult.data || []).forEach(c => { if (c.access_token) tokens.add(c.access_token); });
    (metaSelectionsResult.data || []).forEach(s => { if (s.access_token) tokens.add(s.access_token); });

    const tokenList = Array.from(tokens);

    if (tokenList.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No Meta connection found. Please connect your account first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Fetch accounts from ALL tokens in parallel
    const accountMap = new Map<string, any>();

    const fetchPromises = tokenList.map(async (accessToken) => {
      let url: string | null = `https://graph.facebook.com/v21.0/me/adaccounts?access_token=${accessToken}&fields=id,name,account_status,currency&limit=100`;

      while (url) {
        try {
          const metaResponse = await fetch(url);
          if (!metaResponse.ok) {
            console.error('[get-ad-accounts] Token fetch error:', await metaResponse.text());
            break; 
          }

          const metaData = await metaResponse.json();
          if (metaData.data && Array.isArray(metaData.data)) {
            metaData.data.forEach((acc: any) => {
              // Deduplicate by ID
              if (!accountMap.has(acc.id)) {
                accountMap.set(acc.id, acc);
              }
            });
          }
          url = metaData.paging?.next || null;
        } catch (err) {
          console.error('[get-ad-accounts] Fetch loop error:', err);
          break;
        }
      }
    });

    await Promise.all(fetchPromises);

    const allAccounts = Array.from(accountMap.values());

    return new Response(
      JSON.stringify({ data: allAccounts }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in get-ad-accounts:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});