import { supabase } from './supabase';

export interface TrialData {
  id: string;
  trial_start_at: string | null;
  trial_end_at: string | null;
  trial_status: 'active' | 'expired';
  trial_expired: boolean;
}

export const trialService = {
  async createTrial(userId: string): Promise<void> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const { error } = await supabase
      .from('users')
      .update({
        plan_type: 'trial',
        trial_start_at: startDate.toISOString(),
        trial_end_at: endDate.toISOString(),
        trial_expired: false,
      })
      .eq('id', userId);

    if (error) throw error;
  },

  async getTrialStatus(userId: string): Promise<TrialData | null> {
    const { data, error } = await supabase
      .from('users')
      .select('id, trial_start_at, trial_end_at, trial_expired, plan_type')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const isActive = data.plan_type === 'trial' &&
      !data.trial_expired &&
      data.trial_end_at &&
      new Date(data.trial_end_at) > new Date();

    return {
      id: data.id,
      trial_start_at: data.trial_start_at,
      trial_end_at: data.trial_end_at,
      trial_status: isActive ? 'active' : 'expired',
      trial_expired: data.trial_expired || false,
    };
  },

  async updateTrialStatus(userId: string, status: 'active' | 'expired'): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        trial_expired: status === 'expired',
        plan_type: status === 'expired' ? 'free' : 'trial',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  },

  getRemainingDays(trialEndDate: string): number {
    const now = new Date();
    const endDate = new Date(trialEndDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  },

  isTrialExpired(trialEndDate: string): boolean {
    const now = new Date();
    const endDate = new Date(trialEndDate);
    return now > endDate;
  },

  async sendTrialExpirationWebhook(
    userId: string,
    email: string
  ): Promise<void> {
    try {
      const response = await fetch(
        'https://n8n.srv1181726.hstgr.cloud/webhook-test/Follow-up',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            email: email,
            event: 'trial_expired',
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        console.error('Webhook failed:', response.status);
      }
    } catch (error) {
      console.error('Error sending trial expiration webhook:', error);
    }
  },

  async checkAndHandleExpiration(userId: string, userEmail: string): Promise<boolean> {
    const trialData = await this.getTrialStatus(userId);

    if (!trialData) {
      return false;
    }

    if (trialData.trial_status === 'expired') {
      return true;
    }

    if (trialData.trial_end_at && this.isTrialExpired(trialData.trial_end_at)) {
      await this.updateTrialStatus(userId, 'expired');
      await this.sendTrialExpirationWebhook(userId, userEmail);
      return true;
    }

    return false;
  },
};
