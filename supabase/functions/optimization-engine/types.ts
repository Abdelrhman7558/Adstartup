// Shared types for the optimization engine.

export type Mode = 'OPTIMIZE' | 'SCALE' | 'HOLD';
export type RuleMode = 'OPTIMIZE' | 'SCALE' | 'SHARED' | 'GATE';

export type ActionStatus = 'pending' | 'executed' | 'failed' | 'rolled_back' | 'skipped';

export interface CampaignState {
  user_id: string;
  campaign_id: string;
  current_mode: Mode;
  mode_entered_at: string;
  target_cpa: number | null;
  target_roas: number;
  baseline_cpa: number | null;
  baseline_roas: number | null;
  baseline_calculated_at: string | null;
  inventory_ok: boolean;
  cashflow_ok: boolean;
  ops_ok: boolean;
  optimization_enabled: boolean;
  dry_run: boolean;
  last_optimized_at: string | null;
  last_scaled_at: string | null;
  last_budget_change_at: string | null;
  last_budget_change_pct: number | null;
  consecutive_unstable_days: number;
}

export interface OptimizationRule {
  rule_id: string;
  mode: RuleMode;
  section: string;
  title: string;
  condition: RuleCondition;
  action: string;
  action_params: Record<string, unknown>;
  priority: number;
  enabled: boolean;
  description: string | null;
}

export type ConditionOp = '==' | '!=' | '>' | '>=' | '<' | '<=';

export interface ConditionLeaf {
  metric: string;
  op: ConditionOp;
  value: number | boolean | string;
}

export interface RuleCondition {
  all?: ConditionLeaf[];
  any?: ConditionLeaf[];
}

export interface AdMetrics {
  ad_id: string;
  adset_id: string;
  campaign_id: string;
  ad_name: string;
  campaign_name: string;
  spend: number;
  revenue: number;
  roas: number;
  cpa: number;
  ctr: number;
  cpm: number;
  frequency: number;
  impressions: number;
  clicks: number;
  purchases: number;
  add_to_cart: number;
  unique_outbound_clicks?: number;
  reach?: number;
  attribution_window: '7d' | '14d';
  date_start: string;
  date_stop: string;
  days_running: number;
}

export interface CampaignAggregate {
  campaign_id: string;
  campaign_name: string;
  spend_7d: number;
  revenue_7d: number;
  roas_7d: number;
  cpa_7d: number;
  ctr_7d: number;
  purchases_7d: number;
  spend_14d: number;
  revenue_14d: number;
  roas_14d: number;
  spend_3d: number;
  roas_3d: number;
  ads: AdMetrics[];
  adsets: AdsetMetrics[];
  is_catalog: boolean;
  // Rolling baselines from campaign_baselines
  baseline_cpa?: number;
  baseline_roas?: number;
  baseline_ctr?: number;
}

export interface AdsetMetrics {
  adset_id: string;
  campaign_id: string;
  adset_name: string;
  is_cbo: boolean;
  is_abo: boolean;
  spend: number;
  revenue: number;
  roas: number;
  cpa: number;
  ctr: number;
  frequency: number;
  purchases: number;
  daily_budget?: number;
  lifetime_budget?: number;
}

export interface DecisionContext {
  /** Computed per-ad. Carries every metric a rule might reference. */
  metrics: Record<string, number | boolean | string>;
  ad?: AdMetrics;
  adset?: AdsetMetrics;
  campaign: CampaignAggregate;
  state: CampaignState;
}

export interface PlannedAction {
  rule_id: string;
  action: string;
  action_params: Record<string, unknown>;
  reason: string;
  campaign_id: string;
  adset_id?: string;
  ad_id?: string;
  before_metrics: Record<string, unknown>;
  priority: number;
}

export interface RunSummary {
  run_id: string;
  trigger: string;
  scope: string;
  mode: string;
  campaigns_processed: number;
  actions_taken: number;
  actions_skipped: number;
  errors: number;
  dry_run: boolean;
}

export interface MetaConnection {
  user_id: string;
  ad_account_id: string | null;
  access_token: string;          // decrypted at the edge
  is_connected: boolean;
}
