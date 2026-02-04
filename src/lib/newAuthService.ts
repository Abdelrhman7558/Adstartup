import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  status: 'pending_verification' | 'active' | 'suspended';
  email_verified: boolean;
  verified_at?: string;
  plan_type: 'free' | 'trial' | 'paid' | 'starter' | 'professional' | 'enterprise';
  trial_start_at?: string;
  trial_end_at?: string;
  trial_expired: boolean;
  brief_completed: boolean;
  meta_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User | null;
  error: Error | null;
}

class NewAuthService {
  async signUp(email: string, password: string, fullName: string, phoneNumber?: string, planType: 'free' | 'trial' = 'free') {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber || '',
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      await supabase
        .from('users')
        .update({
          full_name: fullName,
          phone_number: phoneNumber || null,
        })
        .eq('id', authData.user.id);

      if (planType === 'trial') {
        await this.startTrial(authData.user.id);
      }

      return { user: authData.user, error: null };
    } catch (error: any) {
      return { user: null, error };
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned');

      const userData = await this.getUser(data.user.id);

      if (!userData) {
        throw new Error('User data not found');
      }

      if (!userData.email_verified) {
        await supabase.auth.signOut();
        throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
      }

      if (userData.plan_type === 'trial') {
        await this.checkTrialExpiration(data.user.id);

        const updatedUser = await this.getUser(data.user.id);
        if (updatedUser?.trial_expired) {
          await supabase.auth.signOut();
          throw new Error('Your trial has expired. Please subscribe to continue.');
        }
      }

      return { user: userData, error: null };
    } catch (error: any) {
      return { user: null, error };
    }
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    return await this.getUser(authUser.id);
  }

  async verifyEmail(userId: string) {
    const { error } = await supabase
      .from('users')
      .update({
        email_verified: true,
        verified: true,
        verified_at: new Date().toISOString(),
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  }

  async startTrial(userId: string) {
    const { error } = await supabase.rpc('start_user_trial', {
      user_uuid: userId,
    });

    if (error) {
      console.error('Error starting trial:', error);

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      await supabase
        .from('users')
        .update({
          plan_type: 'trial',
          trial_start_at: new Date().toISOString(),
          trial_end_at: trialEndDate.toISOString(),
          trial_expired: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }
  }

  async checkTrialExpiration(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    if (user.plan_type !== 'trial') return false;
    if (user.trial_expired) return true;

    if (user.trial_end_at) {
      const now = new Date();
      const endDate = new Date(user.trial_end_at);

      if (now > endDate) {
        await supabase
          .from('users')
          .update({
            trial_expired: true,
            plan_type: 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        await this.disconnectMeta(userId, 'trial_expired');

        return true;
      }
    }

    return false;
  }

  async getTrialDaysRemaining(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_trial_days_remaining', {
        user_uuid: userId,
      });

      if (error) throw error;

      return data || 0;
    } catch (error) {
      const user = await this.getUser(userId);
      if (!user || user.plan_type !== 'trial' || !user.trial_end_at) {
        return 0;
      }

      const now = new Date();
      const endDate = new Date(user.trial_end_at);
      const diff = endDate.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

      return Math.max(0, days);
    }
  }

  async canAccessBrief(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    if (!user.email_verified) return false;

    if (user.plan_type === 'free') {
      return false;
    }

    if (user.plan_type === 'trial') {
      if (user.trial_expired) return false;
      await this.checkTrialExpiration(userId);
      const updatedUser = await this.getUser(userId);
      return !updatedUser?.trial_expired;
    }

    return true;
  }

  async canAccessDashboard(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    if (!user.email_verified) return false;

    if (user.plan_type === 'free') {
      return false;
    }

    if (user.plan_type === 'trial') {
      if (user.trial_expired) return false;
      await this.checkTrialExpiration(userId);
      const updatedUser = await this.getUser(userId);
      return !updatedUser?.trial_expired;
    }

    if (!user.brief_completed) {
      return false;
    }

    return true;
  }

  async completeBrief(userId: string) {
    const { error } = await supabase
      .from('users')
      .update({
        brief_completed: true,
        brief_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    await supabase
      .from('user_briefs')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }

  async disconnectMeta(userId: string, reason: string = 'manual') {
    try {
      await supabase.rpc('disconnect_user_meta', {
        user_uuid: userId,
        reason,
      });
    } catch (error) {
      await supabase
        .from('meta_connections')
        .update({
          meta_connected: false,
          is_connected: false,
          disconnected_at: new Date().toISOString(),
          disconnect_reason: reason,
          access_token: null,
          refresh_token: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      await supabase
        .from('users')
        .update({
          meta_connected: false,
          meta_disconnected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }
  }

  async upgradeFromFree(userId: string, planType: 'starter' | 'professional' | 'enterprise') {
    const { error } = await supabase
      .from('users')
      .update({
        plan_type: planType,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  }

  async upgradeFromTrial(userId: string, planType: 'starter' | 'professional' | 'enterprise') {
    const { error } = await supabase
      .from('users')
      .update({
        plan_type: planType,
        trial_expired: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  }
}

export const newAuthService = new NewAuthService();
