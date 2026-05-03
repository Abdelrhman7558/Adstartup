import { supabase } from './supabase';

export interface OptimizationLog {
  id: string;
  user_id: string;
  campaign_id: string;
  campaign_name: string;
  action_type: 'scale' | 'optimize' | 'pause' | 'skip' | 'fatigue';
  action_detail: string | null;
  reason: string | null;
  status: 'success' | 'failed' | 'skipped';
  bot_phase: 'testing' | 'optimizing' | 'scaling';
  created_at: string;
}

export interface BotInstruction {
    id: string;
    campaign_id: string;
    instruction: string;
    status: 'pending' | 'executed' | 'failed';
    created_at: string;
}

export interface BotRun {
  id: string;
  trigger: 'cron' | 'manual' | 'webhook' | 'new_campaign';
  scope: 'all' | 'user' | 'campaign';
  scope_target: string | null;
  mode: 'DAILY_ROUTINE' | 'OPTIMIZE_CYCLE' | 'SCALE_CHECK' | 'GUARDRAIL' | 'MANUAL';
  dry_run: boolean;
  started_at: string;
  finished_at: string | null;
  campaigns_processed: number;
  actions_taken: number;
  errors: number;
  status: 'running' | 'success' | 'partial' | 'failed';
}

export interface AgentAction {
  id: string;
  run_id: string | null;
  user_id: string;
  campaign_id: string;
  adset_id: string | null;
  ad_id: string | null;
  rule_id: string | null;
  action: string;
  reason: string | null;
  before_metrics: Record<string, unknown> | null;
  after_metrics: Record<string, unknown> | null;
  dry_run: boolean;
  status: 'pending' | 'executed' | 'failed' | 'rolled_back' | 'skipped';
  created_at: string;
}

export interface CampaignStateRow {
  user_id: string;
  campaign_id: string;
  current_mode: 'OPTIMIZE' | 'SCALE' | 'HOLD';
  mode_entered_at: string;
  target_cpa: number | null;
  target_roas: number;
  baseline_cpa: number | null;
  baseline_roas: number | null;
  optimization_enabled: boolean;
  dry_run: boolean;
  last_optimized_at: string | null;
  last_scaled_at: string | null;
  last_budget_change_at: string | null;
}

export const botControlService = {
  async fetchOptimizationLogs(userId?: string): Promise<OptimizationLog[]> {
    let query = supabase.from('optimization_logs').select('*');
    if (userId) query = query.eq('user_id', userId);
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return data || [];
  },

  async fetchAllOptimizedCampaigns(): Promise<any[]> {
    const { data, error } = await supabase
      .from('meta_campaigns')
      .select('*')
      .eq('optimization_enabled', true);

    if (error) throw error;
    return data || [];
  },

  async saveBotInstruction(userId: string, campaignId: string, instruction: string): Promise<void> {
    const { error } = await supabase
      .from('bot_instructions')
      .insert({
        user_id: userId,
        campaign_id: campaignId,
        instruction,
        status: 'pending'
      });

    if (error) throw error;
  },

  async sendClientNotification(userId: string, message: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'AI Optimizer Note',
        message,
        type: 'info',
        read: false
      });

    if (error) throw error;
  },

  async toggleOptimization(userId: string, campaignId: string, enabled: boolean): Promise<void> {
    const { error: e1 } = await supabase
      .from('meta_campaigns')
      .update({
        optimization_enabled: enabled,
        optimization_enabled_at: enabled ? new Date().toISOString() : null
      })
      .eq('user_id', userId)
      .eq('campaign_id', campaignId);
    if (e1) throw e1;

    // Mirror onto campaign_states (the source of truth for the new engine).
    const { error: e2 } = await supabase
      .from('campaign_states')
      .update({ optimization_enabled: enabled })
      .eq('user_id', userId)
      .eq('campaign_id', campaignId);
    if (e2) throw e2;
  },

  async fetchRecentRuns(limit = 25): Promise<BotRun[]> {
    const { data, error } = await supabase
      .from('bot_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as BotRun[];
  },

  async fetchAgentActions(userId?: string, limit = 200): Promise<AgentAction[]> {
    let q = supabase.from('agent_actions').select('*');
    if (userId) q = q.eq('user_id', userId);
    const { data, error } = await q.order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as AgentAction[];
  },

  async fetchCampaignStates(userId?: string): Promise<CampaignStateRow[]> {
    let q = supabase.from('campaign_states').select('*');
    if (userId) q = q.eq('user_id', userId);
    const { data, error } = await q.order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as CampaignStateRow[];
  },

  async triggerOptimizationRun(opts: {
    mode: 'DAILY_ROUTINE' | 'OPTIMIZE_CYCLE' | 'SCALE_CHECK' | 'GUARDRAIL';
    dryRun: boolean;
    campaignId?: string;
  }): Promise<{ run_id: string; processed: number; executed: number; failed: number }> {
    const { data, error } = await supabase.functions.invoke('optimization-engine', {
      body: { mode: opts.mode, dry_run: opts.dryRun, campaign_id: opts.campaignId },
    });
    if (error) throw error;
    return data;
  },

  async fetchPendingActions(userId?: string): Promise<AgentAction[]> {
    let q = supabase.from('agent_actions').select('*').eq('status', 'pending');
    if (userId) q = q.eq('user_id', userId);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AgentAction[];
  },

  async approveAction(actionId: string): Promise<{ ok: boolean; status: string; meta_response?: unknown; error?: string }> {
    const { data, error } = await supabase.functions.invoke('execute-pending-action', {
      body: { action_id: actionId, decision: 'approve' },
    });
    if (error) throw error;
    return data;
  },

  async rejectAction(actionId: string, note?: string): Promise<{ ok: boolean; status: string }> {
    const { data, error } = await supabase.functions.invoke('execute-pending-action', {
      body: { action_id: actionId, decision: 'reject', note },
    });
    if (error) throw error;
    return data;
  },

  async chatWithAI(message: string, campaignId?: string): Promise<{ reply: string; tools_used: any[]; dispatched: any[] }> {
    const { data, error } = await supabase.functions.invoke('ai-media-buyer', {
      body: { message, campaign_id: campaignId },
    });
    if (error) throw error;
    return data;
  },
};
