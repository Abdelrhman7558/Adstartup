// Build the flat metrics dictionary that rule conditions evaluate against.
// One context per ad. The keys here MUST match the `metric` strings used in
// optimization_rules.condition rows.

import {
  AdMetrics,
  AdsetMetrics,
  CampaignAggregate,
  CampaignState,
} from './types.ts';

export interface BuildContextInput {
  ad?: AdMetrics;
  adset?: AdsetMetrics;
  campaign: CampaignAggregate;
  state: CampaignState;
  /** Last action in agent_actions for this campaign (for rollback / wait rules) */
  lastBudgetChange?: { changed_at: string; pct: number; before_cpa: number; before_roas: number };
  // Optional ops inputs (filled by ai-media-buyer when available)
  considering_permanent_kill?: boolean;
  is_new_variant?: boolean;
}

const HOURS = (ms: number) => ms / 3_600_000;
const DAYS = (ms: number) => ms / 86_400_000;

export function buildContext(input: BuildContextInput): Record<string, number | boolean | string> {
  const { ad, adset, campaign, state, lastBudgetChange } = input;
  const now = Date.now();

  const targetCpa = state.target_cpa ?? campaign.baseline_cpa ?? 0;
  const baselineRoas = state.baseline_roas ?? campaign.baseline_roas ?? 0;
  const baselineCpa = state.baseline_cpa ?? campaign.baseline_cpa ?? 0;

  // Average campaign CPA from the live 7d aggregate (rule A2.4 reference)
  const avgCampaignCpa = campaign.cpa_7d || baselineCpa || 0;

  const ctx: Record<string, number | boolean | string> = {
    // Core ad-level metrics (7d attribution by default)
    roas:        ad ? ad.roas        : campaign.roas_7d,
    cpa:         ad ? ad.cpa         : campaign.cpa_7d,
    ctr:         ad ? ad.ctr         : campaign.ctr_7d,
    cpm:         ad ? ad.cpm         : 0,
    frequency:   ad ? ad.frequency   : 1,
    purchases:   ad ? ad.purchases   : campaign.purchases_7d,
    spend:       ad ? ad.spend       : campaign.spend_7d,
    revenue:     ad ? ad.revenue     : campaign.revenue_7d,
    days_running: ad ? ad.days_running : 7,

    // Derived ratios that rules reference directly
    cpa_vs_target: targetCpa > 0 ? (ad?.cpa ?? campaign.cpa_7d) / targetCpa : 0,
    cpa_vs_avg:    avgCampaignCpa > 0 ? (ad?.cpa ?? campaign.cpa_7d) / avgCampaignCpa : 0,
    spend_vs_avg_cpa:    avgCampaignCpa > 0 ? (ad?.spend ?? 0) / avgCampaignCpa : 0,
    spend_vs_target_cpa: targetCpa > 0 ? (ad?.spend ?? campaign.spend_7d) / targetCpa : 0,

    // Frequency split (we don't yet have cold/warm breakdown; treat overall freq
    // as cold for now — refined once we add audience_segment in v2)
    cold_frequency: ad ? ad.frequency : 1,

    // Stability & change-history flags
    days_unstable: state.consecutive_unstable_days,
    cpa_worsened_after_change: lastBudgetChange
      ? campaign.cpa_7d > 0 && lastBudgetChange.before_cpa > 0 && campaign.cpa_7d > lastBudgetChange.before_cpa * 1.05
      : false,
    days_since_last_budget_change: state.last_budget_change_at
      ? DAYS(now - new Date(state.last_budget_change_at).getTime())
      : 999,
    hours_since_last_budget_increase: state.last_budget_change_at && (state.last_budget_change_pct ?? 0) > 0
      ? HOURS(now - new Date(state.last_budget_change_at).getTime())
      : 9999,
    roas_dropped_after_increase: lastBudgetChange && (lastBudgetChange.pct ?? 0) > 0
      ? campaign.roas_7d > 0 && lastBudgetChange.before_roas > 0 && campaign.roas_7d < lastBudgetChange.before_roas * 0.85
      : false,
    roas_unstable_3d: Math.abs(campaign.roas_3d - campaign.roas_7d) / Math.max(campaign.roas_7d, 0.0001) > 0.25,

    // Catalog / format
    is_catalog: campaign.is_catalog,

    // Adset-level
    is_cbo: adset ? adset.is_cbo : false,
    is_abo: adset ? adset.is_abo : false,
    adset_underdelivering: adset ? adset.spend < (campaign.spend_7d / Math.max(campaign.adsets.length, 1)) * 0.5 : false,
    is_loser: ad ? ad.purchases === 0 && ad.spend > avgCampaignCpa * 6 : false,

    // Campaign-level structure
    top_adset_spend_share: campaign.adsets.length > 0
      ? Math.max(...campaign.adsets.map(a => a.spend)) / Math.max(campaign.spend_7d, 0.0001)
      : 0,
    identical_adsets_in_campaign: countIdenticalAdsets(campaign.adsets),

    // Rule references that need the AI / brief: leave as 0 / false defaults.
    // These get overwritten by the ai-media-buyer agent when it has data.
    audience_overlap_pct: 0,
    both_broad: false,
    format_roas_ratio: 0,
    ctr_drop_3d_pct: 0,
    ctr_declining: ad ? ad.ctr < (campaign.ctr_7d * 0.85) : false,
    cpm_wow_rising: false,
    budget_changed_7d: state.last_budget_change_at
      ? (now - new Date(state.last_budget_change_at).getTime()) < 7 * 86_400_000
      : false,
    first_time_impressions_pct: 100,
    cpa_drift_vs_baseline_pct: baselineCpa > 0
      ? ((campaign.cpa_7d - baselineCpa) / baselineCpa) * 100
      : 0,

    // Pre-scaling gate inputs
    inventory_supports_3x: state.inventory_ok,
    cashflow_supports_scaling: state.cashflow_ok,
    ops_supports_surge: state.ops_ok,

    // Misc passthroughs
    considering_permanent_kill: input.considering_permanent_kill ?? false,
    is_new_variant: input.is_new_variant ?? false,
    requested_budget_increase_pct: 0,
  };
  return ctx;
}

function countIdenticalAdsets(adsets: AdsetMetrics[]): number {
  // Cheap heuristic: same spend bucket + same ROAS bucket. Replaced once we
  // have targeting hashes from the Meta API.
  const buckets = new Map<string, number>();
  for (const a of adsets) {
    const key = `${Math.round(a.spend / 10)}-${Math.round(a.roas)}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Math.max(0, ...Array.from(buckets.values()));
}
