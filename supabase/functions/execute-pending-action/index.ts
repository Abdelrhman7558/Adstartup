// Execute (or reject) a pending agent_action.
//
// Flow:
//   1. AI Media Buyer recommends an action -> stored in agent_actions with
//      status='pending'.
//   2. Operator opens Engine Panel, clicks "Approve" -> this function fires.
//   3. Function looks up the action, dispatches to the right handler:
//        create_campaign      -> calls create-meta-campaign
//        delete_campaign      -> Meta API DELETE on the campaign
//        pause_campaign       -> Meta API status=PAUSED on the campaign
//        pause_ad / pause_adset / increase_budget / decrease_budget /
//        duplicate_to_winners -> hands off to the optimization-engine
//      Anything else just gets marked 'executed' as advisory.
//   4. Updates agent_actions row with the outcome.
//
// Reject path: status='rejected', records rejector + note. No side effects.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const META_VERSION = 'v21.0';

async function decryptToken(supabase: any, ciphertext: string, nonce: string): Promise<string | null> {
  try {
    const { data } = await supabase.rpc('decrypt_meta_token', { ct: ciphertext, n: nonce });
    return data ?? null;
  } catch { return null; }
}

async function getAccessToken(supabase: any, userId: string): Promise<string | null> {
  const { data: conn } = await supabase
    .from('meta_connections').select('*').eq('user_id', userId).maybeSingle();
  if (!conn) return null;
  if (conn.access_token_encrypted && conn.access_token_nonce) {
    const t = await decryptToken(supabase, conn.access_token_encrypted, conn.access_token_nonce);
    if (t) return t;
  }
  return conn.access_token ?? null;
}

async function metaPost(path: string, accessToken: string, body: Record<string, string>): Promise<any> {
  const url = `https://graph.facebook.com/${META_VERSION}${path}`;
  const form = new URLSearchParams({ access_token: accessToken, ...body });
  const res = await fetch(url, { method: 'POST', body: form });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.error) throw new Error(j.error?.error_user_msg || j.error?.message || `Meta ${res.status}`);
  return j;
}

async function metaDelete(path: string, accessToken: string): Promise<any> {
  const url = `https://graph.facebook.com/${META_VERSION}${path}?access_token=${encodeURIComponent(accessToken)}`;
  const res = await fetch(url, { method: 'DELETE' });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.error) throw new Error(j.error?.error_user_msg || j.error?.message || `Meta ${res.status}`);
  return j;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const actionId: string = body.action_id;
    const decision: 'approve' | 'reject' = body.decision ?? 'approve';
    const note: string | undefined = body.note;
    if (!actionId) {
      return new Response(JSON.stringify({ error: 'action_id required' }), { status: 400, headers: corsHeaders });
    }

    // Fetch the action and verify ownership
    const { data: action, error: actionErr } = await supabase
      .from('agent_actions').select('*').eq('id', actionId).maybeSingle();
    if (actionErr || !action) {
      return new Response(JSON.stringify({ error: 'Action not found' }), { status: 404, headers: corsHeaders });
    }
    if (action.user_id !== user.id) {
      // Manager check
      const { data: roleRow } = await supabase
        .from('users').select('role').eq('id', user.id).maybeSingle();
      const isManager = roleRow?.role === 'manager' || roleRow?.role === 'admin';
      if (!isManager) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
      }
    }
    if (action.status !== 'pending') {
      return new Response(JSON.stringify({
        error: `Action is ${action.status}, not pending`, current_status: action.status,
      }), { status: 409, headers: corsHeaders });
    }

    // ----- Reject branch -------------------------------------------------
    if (decision === 'reject') {
      await supabase.from('agent_actions').update({
        status: 'skipped',
        rejected_by: user.id,
        rejected_at: new Date().toISOString(),
        rejection_note: note ?? null,
      }).eq('id', actionId);
      return new Response(JSON.stringify({ ok: true, status: 'rejected' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ----- Approve / execute branch -------------------------------------
    let executeResult: { ok: boolean; status: string; meta_response?: unknown; error?: string } = {
      ok: true, status: 'executed', meta_response: null,
    };

    try {
      const accessToken = await getAccessToken(supabase, action.user_id);
      const params = action.action_params ?? {};

      switch (action.action) {
        case 'create_campaign': {
          // Hand off to create-meta-campaign with the params Claude proposed.
          // params shape mirrors CampaignPayload in create-meta-campaign/index.ts.
          const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/create-meta-campaign`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({ ...params, user_id: action.user_id }),
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(j.error || `create-meta-campaign ${r.status}`);
          executeResult.meta_response = j;
          break;
        }

        case 'delete_campaign': {
          if (!accessToken) throw new Error('No Meta token');
          const r = await metaDelete(`/${action.campaign_id}`, accessToken);
          executeResult.meta_response = r;
          // Also disable optimization for it.
          await supabase.from('campaign_states').update({ optimization_enabled: false })
            .eq('user_id', action.user_id).eq('campaign_id', action.campaign_id);
          break;
        }

        case 'pause_campaign': {
          if (!accessToken) throw new Error('No Meta token');
          const r = await metaPost(`/${action.campaign_id}`, accessToken, { status: 'PAUSED' });
          executeResult.meta_response = r;
          break;
        }

        case 'resume_campaign': {
          if (!accessToken) throw new Error('No Meta token');
          const r = await metaPost(`/${action.campaign_id}`, accessToken, { status: 'ACTIVE' });
          executeResult.meta_response = r;
          break;
        }

        case 'pause_ad': {
          if (!accessToken) throw new Error('No Meta token');
          if (!action.ad_id)  throw new Error('No ad_id');
          const r = await metaPost(`/${action.ad_id}`, accessToken, { status: 'PAUSED' });
          executeResult.meta_response = r;
          break;
        }

        case 'pause_adset': {
          if (!accessToken) throw new Error('No Meta token');
          if (!action.adset_id) throw new Error('No adset_id');
          const r = await metaPost(`/${action.adset_id}`, accessToken, { status: 'PAUSED' });
          executeResult.meta_response = r;
          break;
        }

        case 'increase_budget':
        case 'decrease_budget': {
          if (!accessToken) throw new Error('No Meta token');
          if (!action.adset_id) throw new Error('No adset_id (campaign-level CBO not supported here)');
          const pct = Number(params.pct ?? 20);
          const direction = action.action === 'increase_budget' ? 1 : -1;
          // Read current budget
          const cur = await fetch(
            `https://graph.facebook.com/${META_VERSION}/${action.adset_id}?fields=daily_budget&access_token=${encodeURIComponent(accessToken)}`,
          ).then(r => r.json());
          const current = parseInt(cur?.daily_budget ?? '0', 10);
          if (!current) throw new Error('Adset has no daily_budget');
          const next = Math.max(100, Math.round(current * (1 + (direction * pct) / 100)));
          const r = await metaPost(`/${action.adset_id}`, accessToken, { daily_budget: String(next) });
          executeResult.meta_response = { ...r, previous_daily_budget: current, new_daily_budget: next };
          // Track for rollback
          await supabase.from('campaign_states').update({
            last_budget_change_at: new Date().toISOString(),
            last_budget_change_pct: direction * pct,
          }).eq('user_id', action.user_id).eq('campaign_id', action.campaign_id);
          break;
        }

        default: {
          // Advisory action — no side effect, just record as executed.
          executeResult.meta_response = { advisory: action.action };
        }
      }
    } catch (e: any) {
      executeResult = { ok: false, status: 'failed', error: e?.message ?? String(e) };
    }

    // ----- Persist outcome ----------------------------------------------
    await supabase.from('agent_actions').update({
      status: executeResult.status,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      meta_response: executeResult.meta_response,
      dry_run: false,
    }).eq('id', actionId);

    return new Response(JSON.stringify({
      ok: executeResult.ok,
      status: executeResult.status,
      meta_response: executeResult.meta_response,
      error: executeResult.error,
    }), {
      status: executeResult.ok ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('[execute-pending-action] fatal', e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), { status: 500, headers: corsHeaders });
  }
});
