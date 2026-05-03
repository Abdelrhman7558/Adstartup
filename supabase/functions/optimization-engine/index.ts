// Optimization Engine — V2.
//
// Orchestrates one optimization cycle. Triggered by:
//   - pg_cron (every 3 days OPTIMIZE_CYCLE, daily DAILY_ROUTINE, hourly GUARDRAIL)
//   - manager UI (manual)
//   - new_campaign trigger (auto-enrol the campaign and run a DAILY_ROUTINE)
//
// Reads optimization_rules from DB. Builds a metrics context per ad.
// Evaluates rules in priority order. Plans actions. Executes (or dry-runs).
// Logs everything to bot_runs + agent_actions.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

import * as meta from './meta-api.ts';
import { evaluateCondition } from './condition.ts';
import { buildContext } from './metrics-context.ts';
import { executeAction } from './actions.ts';
import { preScalingGate, shouldExitScale, shouldEnterHold } from './state-machine.ts';
import {
  CampaignAggregate,
  CampaignState,
  OptimizationRule,
  PlannedAction,
  RuleMode,
} from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// ----- Helpers ----------------------------------------------------------

async function decryptToken(supabase: any, ciphertext: string, nonce: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('decrypt_meta_token', {
      ct: ciphertext, n: nonce,
    });
    if (error) return null;
    return data;
  } catch { return null; }
}

async function loadConnectionToken(
  supabase: any, conn: any,
): Promise<string | null> {
  if (conn.access_token_encrypted && conn.access_token_nonce) {
    const t = await decryptToken(supabase, conn.access_token_encrypted, conn.access_token_nonce);
    if (t) return t;
  }
  return conn.access_token ?? null;
}

function fmtAccount(id: string): string {
  return id.startsWith('act_') ? id : `act_${id}`;
}

function rulesByMode(rules: OptimizationRule[], mode: RuleMode | RuleMode[]): OptimizationRule[] {
  const set = Array.isArray(mode) ? mode : [mode];
  return rules
    .filter(r => r.enabled && set.includes(r.mode))
    .sort((a, b) => a.priority - b.priority);
}

// ----- Per-campaign processing -----------------------------------------

interface ProcessOptions {
  cycleMode: 'DAILY_ROUTINE' | 'OPTIMIZE_CYCLE' | 'SCALE_CHECK' | 'GUARDRAIL';
  rules: OptimizationRule[];
  accessToken: string;
  adAccountId: string;
  state: CampaignState;
  dryRun: boolean;
  runId: string;
  supabase: any;
}

async function loadCampaignData(
  accessToken: string,
  adAccountId: string,
  campaignId: string,
): Promise<CampaignAggregate | null> {
  const filter = [{ field: 'campaign.id', operator: 'IN', value: campaignId } as any];
  const account = fmtAccount(adAccountId);

  const [ads7d, ads14d, ads3d, adsetsRaw] = await Promise.all([
    meta.getInsights(accessToken, { adAccountId: account, level: 'ad',  datePreset: 'last_7d',  filtering: filter }),
    meta.getInsights(accessToken, { adAccountId: account, level: 'ad',  datePreset: 'last_14d', filtering: filter }),
    meta.getInsights(accessToken, { adAccountId: account, level: 'ad',  datePreset: 'last_3d',  filtering: filter }),
    meta.getInsights(accessToken, { adAccountId: account, level: 'adset', datePreset: 'last_7d', filtering: filter }),
  ]);

  if (ads7d.length === 0) return null;

  const ads7  = meta.aggregateAdsToMetrics(ads7d, 7);
  const ads14 = meta.aggregateAdsToMetrics(ads14d, 14);
  const ads3  = meta.aggregateAdsToMetrics(ads3d, 3);
  const adsets = meta.aggregateAdsetsToMetrics(adsetsRaw);

  const name = ads7[0]?.campaign_name ?? campaignId;
  return meta.rollupCampaign(ads7, ads14, ads3, adsets, campaignId, name);
}

async function processCampaign(o: ProcessOptions): Promise<{ planned: PlannedAction[]; executed: number; failed: number }> {
  const { state, rules, accessToken, adAccountId, supabase, runId, dryRun, cycleMode } = o;

  const campaign = await loadCampaignData(accessToken, adAccountId, state.campaign_id);
  if (!campaign) {
    return { planned: [], executed: 0, failed: 0 };
  }

  // ----- Compute & persist baselines (C1, B7) ---------------------------
  await upsertBaselines(supabase, state.user_id, campaign);

  // ----- State transitions (A6/B7/A7) -----------------------------------
  const transitions: { reason: string; next: string }[] = [];
  if (state.current_mode === 'SCALE') {
    const exit = shouldExitScale(campaign, state);
    if (exit) {
      transitions.push({ reason: exit.reason, next: exit.next_mode });
      state.current_mode = exit.next_mode;
    }
  }
  const hold = shouldEnterHold(campaign, state);
  if (hold) {
    transitions.push({ reason: hold.reason, next: hold.next_mode });
    state.current_mode = hold.next_mode;
  }
  if (cycleMode === 'SCALE_CHECK' && state.current_mode === 'OPTIMIZE') {
    const gate = preScalingGate(campaign, state);
    if (!gate) {
      transitions.push({ reason: 'A7 gate cleared', next: 'SCALE' });
      state.current_mode = 'SCALE';
    } else if (gate.next_mode !== state.current_mode) {
      transitions.push({ reason: gate.reason, next: gate.next_mode });
      state.current_mode = gate.next_mode;
    }
  }

  if (transitions.length) {
    await supabase.from('campaign_states')
      .update({
        current_mode: state.current_mode,
        mode_entered_at: new Date().toISOString(),
      })
      .eq('user_id', state.user_id)
      .eq('campaign_id', state.campaign_id);
  }

  // HOLD mode short-circuits all rule evaluation.
  if (state.current_mode === 'HOLD') {
    return { planned: [], executed: 0, failed: 0 };
  }

  // ----- Rule selection by cycle mode -----------------------------------
  let activeRules: OptimizationRule[];
  if (cycleMode === 'DAILY_ROUTINE') {
    activeRules = rulesByMode(rules, ['SHARED']);
  } else if (cycleMode === 'OPTIMIZE_CYCLE') {
    activeRules = rulesByMode(rules, state.current_mode === 'SCALE' ? ['SCALE','SHARED'] : ['OPTIMIZE','SHARED']);
  } else if (cycleMode === 'SCALE_CHECK') {
    activeRules = rulesByMode(rules, ['GATE','SCALE']);
  } else {
    activeRules = rulesByMode(rules, ['SHARED','SCALE']);
  }

  // ----- Per-ad rule evaluation -----------------------------------------
  const planned: PlannedAction[] = [];

  // INSUFFICIENT DATA gate (C1.3)
  const minDays = Math.min(...campaign.ads.map(a => a.days_running));
  if (minDays < 3) {
    planned.push({
      rule_id: 'C1.3',
      action: 'output_insufficient_data',
      action_params: { min_days: 3 },
      reason: `Only ${minDays}d data available — need 3 days minimum.`,
      campaign_id: state.campaign_id,
      before_metrics: { days_running: minDays },
      priority: 1,
    });
  } else {
    for (const ad of campaign.ads) {
      const adset = campaign.adsets.find(a => a.adset_id === ad.adset_id);
      const ctx = buildContext({ ad, adset, campaign, state });
      for (const rule of activeRules) {
        if (evaluateCondition(rule.condition, ctx)) {
          planned.push({
            rule_id: rule.rule_id,
            action: rule.action,
            action_params: rule.action_params,
            reason: rule.title,
            campaign_id: state.campaign_id,
            adset_id: ad.adset_id,
            ad_id: ad.ad_id,
            before_metrics: { roas: ad.roas, cpa: ad.cpa, ctr: ad.ctr, frequency: ad.frequency, spend: ad.spend },
            priority: rule.priority,
          });
        }
      }
    }
  }

  // De-duplicate planned actions: at most one of each {action, ad_id} pair,
  // keeping the highest-priority (lowest priority number) trigger.
  const seen = new Set<string>();
  planned.sort((a, b) => a.priority - b.priority);
  const unique = planned.filter(p => {
    const key = `${p.action}|${p.ad_id ?? p.adset_id ?? p.campaign_id}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });

  // ----- Execute --------------------------------------------------------
  let executed = 0, failed = 0;
  for (const p of unique) {
    const ad = campaign.ads.find(a => a.ad_id === p.ad_id);
    const result = await executeAction(p, { accessToken, dryRun }, { ad, campaign, state });

    await supabase.from('agent_actions').insert({
      run_id: runId,
      user_id: state.user_id,
      campaign_id: state.campaign_id,
      adset_id: p.adset_id,
      ad_id: p.ad_id,
      rule_id: p.rule_id,
      action: p.action,
      action_params: p.action_params,
      reason: p.reason,
      before_metrics: p.before_metrics,
      after_metrics: result.after_metrics,
      dry_run: dryRun,
      status: result.status,
      meta_response: result.meta_response,
    });

    if (result.status === 'executed' || result.status === 'rolled_back') executed++;
    else if (result.status === 'failed') failed++;
  }

  // Track budget changes for next-run rollback context.
  const lastBudgetAction = unique.find(p => p.action === 'increase_budget' || p.action === 'decrease_budget');
  if (lastBudgetAction) {
    const pct = Number(lastBudgetAction.action_params.pct ?? 20) * (lastBudgetAction.action === 'increase_budget' ? 1 : -1);
    await supabase.from('campaign_states')
      .update({
        last_budget_change_at: new Date().toISOString(),
        last_budget_change_pct: pct,
      })
      .eq('user_id', state.user_id)
      .eq('campaign_id', state.campaign_id);
  }

  // last_optimized_at
  await supabase.from('campaign_states')
    .update({ last_optimized_at: new Date().toISOString() })
    .eq('user_id', state.user_id)
    .eq('campaign_id', state.campaign_id);

  return { planned: unique, executed, failed };
}

async function upsertBaselines(supabase: any, userId: string, c: CampaignAggregate) {
  const rows = [
    { user_id: userId, campaign_id: c.campaign_id, window_days: 7,  spend: c.spend_7d,  revenue: c.revenue_7d,  roas: c.roas_7d,  cpa: c.cpa_7d,  ctr: c.ctr_7d,  purchases: c.purchases_7d, computed_at: new Date().toISOString() },
    { user_id: userId, campaign_id: c.campaign_id, window_days: 14, spend: c.spend_14d, revenue: c.revenue_14d, roas: c.roas_14d, cpa: c.spend_14d > 0 && c.purchases_7d > 0 ? c.spend_14d/c.purchases_7d : 0, ctr: c.ctr_7d, purchases: c.purchases_7d, computed_at: new Date().toISOString() },
    { user_id: userId, campaign_id: c.campaign_id, window_days: 3,  spend: c.spend_3d,  revenue: 0, roas: c.roas_3d, cpa: 0, ctr: 0, purchases: 0, computed_at: new Date().toISOString() },
  ];
  for (const r of rows) {
    await supabase.from('campaign_baselines').upsert(r, { onConflict: 'user_id,campaign_id,window_days' });
  }
}

// ----- Entry point ------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const isCron = authHeader === `Bearer ${Deno.env.get('CRON_SECRET') ?? ''}` && !!Deno.env.get('CRON_SECRET');

    let userId: string | null = null;
    if (!isCron) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      userId = user.id;
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const cycleMode: 'DAILY_ROUTINE' | 'OPTIMIZE_CYCLE' | 'SCALE_CHECK' | 'GUARDRAIL'
      = body.mode ?? 'DAILY_ROUTINE';
    const dryRun: boolean = body.dry_run ?? true;
    const targetCampaignId: string | null = body.campaign_id ?? null;

    // 1. Load all enabled rules once.
    const { data: rulesData } = await supabase
      .from('optimization_rules').select('*').eq('enabled', true);
    const rules: OptimizationRule[] = rulesData ?? [];

    // 2. Open a bot_runs row.
    const { data: runRow, error: runErr } = await supabase
      .from('bot_runs').insert({
        trigger: isCron ? 'cron' : 'manual',
        triggered_by: userId,
        scope: targetCampaignId ? 'campaign' : (userId ? 'user' : 'all'),
        scope_target: targetCampaignId ?? userId ?? null,
        mode: cycleMode,
        dry_run: dryRun,
      }).select().single();
    if (runErr || !runRow) {
      return new Response(JSON.stringify({ error: 'Failed to open run', detail: runErr?.message }), { status: 500, headers: corsHeaders });
    }
    const runId = runRow.id;

    // 3. Load campaign states to process.
    let stateQ = supabase
      .from('campaign_states').select('*')
      .eq('optimization_enabled', true);
    if (userId) stateQ = stateQ.eq('user_id', userId);
    if (targetCampaignId) stateQ = stateQ.eq('campaign_id', targetCampaignId);
    const { data: states } = await stateQ;
    const targetStates: CampaignState[] = states ?? [];

    // 4. For each user, fetch the meta connection once.
    const userIds = Array.from(new Set(targetStates.map(s => s.user_id)));
    const { data: connections } = await supabase
      .from('meta_connections').select('*').in('user_id', userIds);
    const connByUser = new Map<string, any>((connections ?? []).map((c: any) => [c.user_id, c]));

    let processed = 0, executed = 0, failed = 0;
    const errors: any[] = [];

    for (const s of targetStates) {
      try {
        const conn = connByUser.get(s.user_id);
        if (!conn || !conn.ad_account_id) continue;
        const accessToken = await loadConnectionToken(supabase, conn);
        if (!accessToken) {
          errors.push({ campaign_id: s.campaign_id, error: 'token unavailable' });
          continue;
        }
        const result = await processCampaign({
          cycleMode, rules, accessToken,
          adAccountId: conn.ad_account_id,
          state: s, dryRun, runId, supabase,
        });
        processed += 1;
        executed += result.executed;
        failed   += result.failed;
      } catch (e: any) {
        errors.push({ campaign_id: s.campaign_id, error: e?.message ?? String(e) });
      }
    }

    const status = failed > 0 ? 'partial' : 'success';

    await supabase.from('bot_runs').update({
      finished_at: new Date().toISOString(),
      campaigns_processed: processed,
      actions_taken: executed,
      errors: failed + errors.length,
      error_details: errors.length ? errors : null,
      status,
    }).eq('id', runId);

    return new Response(JSON.stringify({
      run_id: runId, processed, executed, failed, errors, dry_run: dryRun, mode: cycleMode,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e: any) {
    console.error('[optimization-engine] fatal', e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), { status: 500, headers: corsHeaders });
  }
});
