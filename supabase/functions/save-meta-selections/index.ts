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
      // 1. Fetch the access_token from the main selection table (where callback saved it)
      const { data: existingSelection, error: fetchError } = await supabase
        .from('meta_account_selections')
        .select('access_token')
        .eq('user_id', user.id)
        .single();

      if (fetchError || !existingSelection?.access_token) {
        console.error('Error fetching access token for manager connection:', fetchError);
        // Continue but log error - maybe token expired or missing
      } else {
        // 2. Insert into manager_meta_accounts
        const { error: managerInsertError } = await supabase
          .from('manager_meta_accounts')
          .insert({
            user_id: user.id,
            account_id: payload.ad_account_id,
            account_name: payload.ad_account_name,
            access_token: existingSelection.access_token
          });

        if (managerInsertError) {
          console.error('Error saving to manager_meta_accounts:', managerInsertError);
          // Don't fail the whole request, but log it
        }
      }
    }

    const { data: selectionData, error: selectionError } = await supabase
      .from('meta_account_selections')
      .upsert({
        user_id: targetUserId,
        brief_id: payload.brief_id || null,
        ad_account_id: payload.ad_account_id,
        ad_account_name: payload.ad_account_name,
        pixel_id: payload.pixel_id || null,
        pixel_name: payload.pixel_name || null,
        catalog_id: payload.catalog_id || null,
        catalog_name: payload.catalog_name || null,
        selection_completed: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (selectionError) {
      console.error('Error saving selections:', selectionError);
      return new Response(
        JSON.stringify({ error: 'Failed to save selections' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also update meta_connections with page and catalog data
    const { error: connectionError } = await supabase
      .from('meta_connections')
      .upsert({
        user_id: targetUserId,
        ad_account_id: payload.ad_account_id,
        pixel_id: payload.pixel_id || null,
        page_id: payload.page_id || null,
        page_name: payload.page_name || null,
        catalog_id: payload.catalog_id || null,
        catalog_name: payload.catalog_name || null,
        is_connected: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (connectionError) {
      console.error('Error saving to meta_connections:', connectionError);
      // Don't fail the entire operation if meta_connections update fails
      // Log it but continue
    }

    const webhookPayload = {
      user_id: targetUserId,
      brief_id: payload.brief_id || null,
      page_id: payload.page_id || null,
      page_name: payload.page_name || null,
      ad_account_id: payload.ad_account_id,
      ad_account_name: payload.ad_account_name,
      pixel_id: payload.pixel_id || null,
      pixel_name: payload.pixel_name || null,
      catalog_id: payload.catalog_id || null,
      catalog_name: payload.catalog_name || null,
      brief_data: briefData
    };

    try {
      console.log('Sending data to n8n webhook...');
      const webhookResponse = await fetch(
        'https://n8n.srv1181726.hstgr.cloud/webhook-test/meta-save-selection',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookPayload)
        }
      );

      if (!webhookResponse.ok) {
        throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
      }

      const webhookResult = await webhookResponse.json();
      console.log('Webhook success:', webhookResult);

      await supabase
        .from('meta_account_selections')
        .update({
          webhook_submitted: true,
          webhook_response: webhookResult
        })
        .eq('id', selectionData.id);

    } catch (webhookError) {
      console.error('Webhook error:', webhookError);
      // Return error to frontend so it doesn't redirect
      return new Response(
        JSON.stringify({ error: 'Failed to send data to external webhook. Please try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: selectionData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in save-meta-selections:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});