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

    const body = await req.json().catch(() => ({}));
    const selectedPageId = body.page_id;

    if (!selectedPageId) {
      return new Response(
        JSON.stringify({ error: 'Missing page_id in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try meta_connections first
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
        JSON.stringify({ error: 'Meta not connected. Please connect your Meta account first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[get-instagram-accounts] Fetching Instagram Actor ID for page: ${selectedPageId}`);

    // Request the instagram_accounts connected to the page
    const metaResponse = await fetch(
      `https://graph.facebook.com/v19.0/${selectedPageId}?fields=instagram_accounts{id,username},page_backed_instagram_accounts{id,username}&access_token=${accessToken}`
    );

    if (!metaResponse.ok) {
      const errorData = await metaResponse.json();

      if (errorData.error?.code === 190) {
        return new Response(
          JSON.stringify({ error: 'Meta access token expired. Please reconnect your Meta account.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: errorData.error?.message || 'Failed to fetch Instagram accounts from Meta' }),
        { status: metaResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const metaData = await metaResponse.json();
    const instagramAccounts = [];

    // Prioritize connected Instagram accounts
    if (metaData.instagram_accounts?.data?.length > 0) {
      metaData.instagram_accounts.data.forEach((ig: any) => {
        instagramAccounts.push({
          id: ig.id,
          username: ig.username || `Instagram Account (${ig.id})`,
          type: 'connected'
        });
      });
    }

    // Add page-backed Instagram accounts
    if (metaData.page_backed_instagram_accounts?.data?.length > 0) {
      metaData.page_backed_instagram_accounts.data.forEach((ig: any) => {
        instagramAccounts.push({
          id: ig.id,
          username: ig.username || `Page-backed Account (${ig.id})`,
          type: 'page-backed'
        });
      });
    }

    if (instagramAccounts.length === 0) {
      return new Response(
        JSON.stringify({
          data: [],
          message: 'No Instagram accounts connected to this Page.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ data: instagramAccounts }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-instagram-accounts:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
