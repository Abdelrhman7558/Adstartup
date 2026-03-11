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

    // Try meta_connections first
    const { data: metaConnections, error: metaError } = await supabase
      .from('meta_connections')
      .select('access_token, catalog_id')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    const metaConnection = metaConnections?.[0];
    let accessToken = metaConnection?.access_token;
    let savedCatalogId = metaConnection?.catalog_id;

    // Fallback: check meta_account_selections (token stored after OAuth)
    if (!accessToken) {
      const { data: metaSelections } = await supabase
        .from('meta_account_selections')
        .select('access_token, catalog_id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);
      accessToken = metaSelections?.[0]?.access_token;
      if (!savedCatalogId) savedCatalogId = metaSelections?.[0]?.catalog_id;
    }

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'No Meta connection found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let allCatalogs: any[] = [];

    // If we already have a selected catalog in DB, just return that specific one
    if (savedCatalogId) {
      const catalogRes = await fetch(`https://graph.facebook.com/v18.0/${savedCatalogId}?access_token=${accessToken}&fields=id,name`);
      if (catalogRes.ok) {
        const catData = await catalogRes.json();
        return new Response(
          JSON.stringify({ data: [catData] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fallback if no specific catalog saved: fetch all catalogs via businesses
    let url: string | null = `https://graph.facebook.com/v18.0/me/businesses?access_token=${accessToken}&fields=id,name,owned_product_catalogs{id,name,product_count},client_product_catalogs{id,name,product_count}&limit=100`;

    while (url) {
      const metaResponse = await fetch(url);

      if (!metaResponse.ok) {
        const errorData = await metaResponse.json();
        return new Response(
          JSON.stringify({ error: errorData.error?.message || 'Failed to fetch catalogs' }),
          { status: metaResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const metaData = await metaResponse.json();

      if (metaData.data) {
        metaData.data.forEach((business: any) => {
          if (business.owned_product_catalogs?.data) {
            allCatalogs.push(...business.owned_product_catalogs.data);
          }
          if (business.client_product_catalogs?.data) {
            allCatalogs.push(...business.client_product_catalogs.data);
          }
        });
      }

      url = metaData.paging?.next || null;
    }

    // If still empty and we know they have ONE catalog connected somehow from elsewhere, 
    // at least we tried.
    return new Response(
      JSON.stringify({ data: allCatalogs }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in get-catalogs:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});