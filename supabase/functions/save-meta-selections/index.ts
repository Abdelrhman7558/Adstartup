import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SelectionPayload {
  user_id?: string;
  brief_id?: string;
  page_id?: string;
  page_name?: string;
  instagram_actor_id?: string;
  instagram_actor_name?: string;
  ad_account_id: string;
  ad_account_name: string;
  pixel_id?: string;
  pixel_name?: string;
  catalog_id?: string;
  catalog_name?: string;
  is_manager_connection?: boolean;
}

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

    const payload: SelectionPayload = await req.json();
    const targetUserId = payload.user_id || user.id;

    if (!payload.ad_account_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: ad_account_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let briefData = null;


    // Only fetch brief if brief_id is provided
    if (payload.brief_id) {
      const { data: fetchedBrief, error: briefError } = await supabase
        .from('client_briefs')
        .select('*')
        .eq('id', payload.brief_id)
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (briefError) {
        console.error('Error fetching brief:', briefError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch brief' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!fetchedBrief) {
        return new Response(
          JSON.stringify({ error: 'Brief not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      briefData = fetchedBrief;
    }

    // MANAGER PLAN LOGIC: If this is a manager adding an extra account
    if (payload.is_manager_connection) {
      // 1. Fetch the access_token from the meta_connections table (where callback saved it)
      const { data: existingConnection, error: fetchError } = await supabase
        .from('meta_connections')
        .select('access_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError || !existingConnection?.access_token) {
        console.error('Error fetching access token for manager connection:', fetchError);
        // Fallback: try to fetch from meta_account_selections just in case
        const { data: legacySelection } = await supabase
          .from('meta_account_selections')
          .select('access_token')
          .eq('user_id', user.id)
          .maybeSingle();

        if (legacySelection?.access_token) {
          existingConnection.access_token = legacySelection.access_token;
        }
      }

      if (existingConnection?.access_token) {
        // 2. Insert into manager_meta_accounts
        const { error: managerInsertError } = await supabase
          .from('manager_meta_accounts')
          .insert({
            user_id: user.id,
            account_id: payload.ad_account_id,
            account_name: payload.ad_account_name,
            access_token: existingConnection.access_token
          });

        if (managerInsertError) {
          console.error('Error saving to manager_meta_accounts:', managerInsertError);
        }
      }
    }

    const insertSelectionPayload: any = {
      user_id: targetUserId,
      brief_id: payload.brief_id || null,
      page_id: payload.page_id || null,
      page_name: payload.page_name || null,
      instagram_actor_id: payload.instagram_actor_id || null,
      instagram_actor_name: payload.instagram_actor_name || null,
      ad_account_id: payload.ad_account_id,
      ad_account_name: payload.ad_account_name,
      pixel_id: payload.pixel_id || null,
      pixel_name: payload.pixel_name || null,
      catalog_id: payload.catalog_id || null,
      catalog_name: payload.catalog_name || null,
      selection_completed: true,
      updated_at: new Date().toISOString(),
    };

    let { data: selectionData, error: selectionError } = await supabase
      .from('meta_account_selections')
      .upsert(insertSelectionPayload, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    // Fallback if columns do not exist
    if (selectionError && selectionError.code === '42703') {
      console.warn('Column missing in meta_account_selections, retrying without optional columns...', selectionError.message);

      // Remove more columns if they likely cause the error
      const columnsToRemove = ['instagram_actor_id', 'instagram_actor_name', 'page_id', 'page_name', 'access_token'];
      columnsToRemove.forEach(col => delete insertSelectionPayload[col]);

      const retryResult = await supabase
        .from('meta_account_selections')
        .upsert(insertSelectionPayload, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      selectionData = retryResult.data;
      selectionError = retryResult.error;
    }

    if (selectionError) {
      console.error('Error saving selections:', selectionError);
      return new Response(
        JSON.stringify({ error: 'Failed to save selections: ' + selectionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch access_token from meta_connections (source of truth)
    let savedAccessToken: string | null = null;
    const { data: connectionData } = await supabase
      .from('meta_connections')
      .select('access_token')
      .eq('user_id', targetUserId)
      .maybeSingle();
    savedAccessToken = connectionData?.access_token || null;

    // Also update meta_connections with page, catalog data AND access_token
    const metaConnectionData: Record<string, any> = {
      user_id: targetUserId,
      ad_account_id: payload.ad_account_id,
      pixel_id: payload.pixel_id || null,
      page_id: payload.page_id || null,
      page_name: payload.page_name || null,
      instagram_actor_id: payload.instagram_actor_id || null,
      instagram_actor_name: payload.instagram_actor_name || null,
      catalog_id: payload.catalog_id || null,
      catalog_name: payload.catalog_name || null,
      is_connected: true,
      updated_at: new Date().toISOString(),
    };

    if (savedAccessToken) {
      metaConnectionData.access_token = savedAccessToken;
    }

    let { error: connectionError } = await supabase
      .from('meta_connections')
      .upsert(metaConnectionData, { onConflict: 'user_id' });

    if (connectionError && connectionError.code === '42703') {
      console.warn('Column missing in meta_connections, retrying without optional columns...', connectionError.message);
      delete metaConnectionData.instagram_actor_id;
      delete metaConnectionData.instagram_actor_name;
      // We don't remove page_id/page_name here because 20260102122541 migration already added them

      const retryResult = await supabase
        .from('meta_connections')
        .upsert(metaConnectionData, { onConflict: 'user_id' });

      connectionError = retryResult.error;
    }

    if (connectionError) {
      console.error('Error saving to meta_connections:', connectionError);
    }

    return new Response(
      JSON.stringify({ success: true, data: selectionData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in save-meta-selections:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});