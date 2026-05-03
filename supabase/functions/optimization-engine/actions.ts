// Action executors. Every rule's `action` string maps to one function here.
// Pure functions: each returns an `ExecutedAction` describing what was
// (or would be, in dry-run) done. Side-effect work (Meta API calls, DB writes)
// happens behind a single `dryRun` flag.

import * as meta from './meta-api.ts';
import { AdMetrics, CampaignAggregate, CampaignState, PlannedAction } from './types.ts';

export interface ExecuteEnv {
  accessToken: string;
  dryRun: boolean;
}

export interface ExecutedAction {
  ok: boolean;
  status: 'executed' | 'skipped' | 'failed' | 'rolled_back';
  meta_response?: unknown;
  error?: string;
  after_metrics?: Record<string, unknown>;
  /** for rollback: opaque payload future runs will need */
  rollback_token?: Record<string, unknown>;
}

const skip = (reason: string): ExecutedAction => ({ ok: true, status: 'skipped', error: reason });
const dryRunResult = (note: string): ExecutedAction => ({
  ok: true,
  status: 'skipped',
  meta_response: { dry_run: true, note },
});

export async function executeAction(
  planned: PlannedAction,
  env: ExecuteEnv,
  ctx: { ad?: AdMetrics; campaign: CampaignAggregate; state: CampaignState },
): Promise<ExecutedAction> {
  if (env.dryRun) {
    return dryRunResult(`would ${planned.action} on ${planned.ad_id ?? planned.adset_id ?? planned.campaign_id}`);
  }

  try {
    switch (planned.action) {
      case 'pause_ad':
      case 'pause_and_refresh_creative': {
        if (!planned.ad_id) return skip('no ad_id');
        const r = await meta.pauseAd(env.accessToken, planned.ad_id);
        return { ok: true, status: 'executed', meta_response: r };
      }
      case 'pause_adset': {
        if (!planned.adset_id) return skip('no adset_id');
        const r = await meta.pauseAdset(env.accessToken, planned.adset_id);
        return { ok: true, status: 'executed', meta_response: r };
      }
      case 'increase_budget':
      case 'decrease_budget': {
        if (!planned.adset_id) return skip('no adset_id');
        const pct = Number(planned.action_params.pct ?? 20);
        const direction = planned.action === 'increase_budget' ? 1 : -1;
        const adset = await meta.getAdset(env.accessToken, planned.adset_id);
        const current = parseInt(adset.daily_budget ?? '0', 10);
        if (!current) return skip('adset has no daily_budget (probably CBO)');
        const next = Math.max(100, Math.round(current * (1 + (direction * pct) / 100)));
        const r = await meta.updateAdsetBudget(env.accessToken, planned.adset_id, next);
        return {
          ok: true,
          status: 'executed',
          meta_response: r,
          rollback_token: { adset_id: planned.adset_id, previous_daily_budget: current },
        };
      }
      case 'rollback_last_budget_change':
      case 'rollback_budget_exit_scale': {
        if (!planned.adset_id) return skip('no adset_id');
        const previous = Number(planned.action_params.previous_daily_budget ?? 0);
        if (!previous) return skip('no previous budget recorded');
        const r = await meta.updateAdsetBudget(env.accessToken, planned.adset_id, previous);
        return { ok: true, status: 'rolled_back', meta_response: r };
      }
      case 'duplicate_to_winners':
      case 'add_to_winners_and_scale': {
        // Resolve / create the Winners campaign for this user, then duplicate
        // the winning adset into it. We deep_copy with status PAUSED so the
        // operator (or AI) can review before going live.
        if (!planned.adset_id) return skip('no adset_id');
        // Winners campaign id is expected to be passed via action_params.
        const winnersCampaignId = String(planned.action_params.winners_campaign_id ?? '');
        if (!winnersCampaignId) {
          return skip('winners_campaign_id missing — orchestrator must create Winners campaign first');
        }
        const r = await meta.duplicateAdset(env.accessToken, planned.adset_id, winnersCampaignId);
        return { ok: true, status: 'executed', meta_response: r };
      }
      case 'flag_clear_winner':
      case 'flag_self_competition':
      case 'flag_overlap':
      case 'flag_creative_fatigue':
      case 'output_insufficient_data':
      case 'use_attribution_window':
      case 'apply_min_spend_floor':
      case 'reduce_min_spend':
      case 'reject_action':
      case 'block_action':
      case 'block_scaling_enter_hold':
      case 'block_scaling_stay_optimize':
      case 'block_scaling_refresh_creative':
      case 'block_scaling_stabilize':
      case 'enter_hold_mode':
      case 'pause_scaling_refresh_creative':
      case 'launch_new_creative_variants':
      case 'expand_audience':
      case 'duplicate_winning_format':
      case 'exit_scale_mode': {
        // Advisory / state-only rules. The state machine consumes these via
        // `planned.action`; no Meta call here. The orchestrator records them.
        return { ok: true, status: 'executed', meta_response: { advisory: planned.action } };
      }
      default:
        return { ok: false, status: 'failed', error: `Unknown action ${planned.action}` };
    }
  } catch (e: any) {
    return { ok: false, status: 'failed', error: e?.message ?? String(e) };
  }
}
