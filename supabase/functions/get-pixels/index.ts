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

    // Fetch pixels from the 'Accounts' table based on the n8n workflow logic
    const { data: accountData, error: accountError } = await supabase
      .from('Accounts')
      .select('Pixels')
      .eq('User ID', user.id)
      .limit(1)
      .maybeSingle();

    if (accountError) {
      console.error('[get-pixels] Error querying Accounts table:', accountError);
    }

    let pixelsArray: any[] = [];

    if (accountData && accountData.Pixels) {
      if (Array.isArray(accountData.Pixels)) {
        pixelsArray = accountData.Pixels;
        console.log(`[get-pixels] Successfully retrieved Pixels array from Accounts table for user: ${user.id}`);
      } else if (typeof accountData.Pixels === 'string') {
        try {
          pixelsArray = JSON.parse(accountData.Pixels);
          console.log(`[get-pixels] Successfully parsed Pixels string from Accounts table for user: ${user.id}`);
        } catch (e) {
          console.warn('[get-pixels] Failed to parse Pixels string from Accounts table:', e);
        }
      }
    }

    // Optional filtering if adAccountId is selected
    if (pixelsArray.length > 0 && adAccountId) {
      const filtered = pixelsArray.filter((p: any) => p.account_id === adAccountId || p.ad_account_id === adAccountId);
      // We only override if it actually matched something, otherwise return the whole list from DB
      if (filtered.length > 0) {
        pixelsArray = filtered;
      }
    }

    if (pixelsArray.length === 0) {
      if (!adAccountId) {
        return new Response(
          JSON.stringify({ error: 'Missing ad_account_id. Please select an ad account first.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Ensure the ad account ID has the 'act_' prefix if it's strictly numeric
      let formattedAdAccountId = adAccountId;
      if (/^\d+$/.test(adAccountId)) {
        formattedAdAccountId = `act_${adAccountId}`;
      }

      console.log(`[get-pixels] Fetching pixels from Meta API as fallback for Ad Account: ${formattedAdAccountId}`);

      let allPixels: any[] = [];
      let url: string | null = `https://graph.facebook.com/v19.0/${formattedAdAccountId}/adspixels?access_token=${accessToken}&fields=id,name,last_fired_time&limit=100`;

      while (url) {
        const metaResponse = await fetch(url);

        if (!metaResponse.ok) {
          const errorData = await metaResponse.json();
          console.error('[get-pixels] Meta API Error Response:', JSON.stringify(errorData));
          return new Response(
            JSON.stringify({ error: errorData.error?.message || 'Failed to fetch pixels', details: errorData }),
            { status: metaResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const metaData = await metaResponse.json();
        allPixels = allPixels.concat(metaData.data || []);
        url = metaData.paging?.next || null;
      }
      pixelsArray = allPixels;
    }

    return new Response(
      JSON.stringify({ data: pixelsArray }),
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