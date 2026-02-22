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

    const url = new URL(req.url);
    let adAccountId = url.searchParams.get('ad_account_id');

    // Also accept ad_account_id from POST body
    if (!adAccountId && req.method === 'POST') {
      try {
        const body = await req.json();
        adAccountId = body.ad_account_id || null;
      } catch { /* no body */ }
    }

    const { data: metaConnection, error: metaError } = await supabase
      .from('meta_connections')
      .select('access_token, ad_account_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let accessToken = metaConnection?.access_token;

    // Fallback: check meta_account_selections (token stored after OAuth)
    if (!accessToken) {
      const { data: metaSelection } = await supabase
        .from('meta_account_selections')
        .select('access_token')
        .eq('user_id', user.id)
        .maybeSingle();
      accessToken = metaSelection?.access_token;
    }

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'No Meta connection found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fall back to the ad_account_id from meta_connections if not provided
    if (!adAccountId) {
      adAccountId = metaConnection?.ad_account_id || null;
    }

    if (!adAccountId) {
      return new Response(
        JSON.stringify({ error: 'Missing ad_account_id. Please select an ad account first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const metaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/adspixels?access_token=${accessToken}&fields=id,name,last_fired_time`
    );

    if (!metaResponse.ok) {
      const errorData = await metaResponse.json();
      return new Response(
        JSON.stringify({ error: errorData.error?.message || 'Failed to fetch pixels' }),
        { status: metaResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const metaData = await metaResponse.json();

    return new Response(
      JSON.stringify({ data: metaData.data || [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-pixels:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});