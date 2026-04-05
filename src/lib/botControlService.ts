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

export const botControlService = {
  async fetchOptimizationLogs(userId: string): Promise<OptimizationLog[]> {
    const { data, error } = await supabase
      .from('optimization_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

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
    const { error } = await supabase
      .from('meta_campaigns')
      .update({
        optimization_enabled: enabled,
        optimization_enabled_at: enabled ? new Date().toISOString() : null
      })
      .eq('user_id', userId)
      .eq('campaign_id', campaignId);

    if (error) throw error;
    
    // Also sync to the other campaigns table if needed
    await supabase
      .from('campaigns')
      .update({
        optimization_enabled: enabled
      })
      .eq('user_id', userId)
      .eq('id', campaignId);
  }
};
