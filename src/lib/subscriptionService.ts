import { supabase } from './supabase';

export interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  plan_price: number;
  status: string;
  created_at: string;
  expires_at?: string;
}

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status, expires_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Error checking subscription:', error);
      return false;
    }

    if (!data) return false;

    // If there's an expiry date, check if it's still valid
    if (data.expires_at) {
      const expiryDate = new Date(data.expires_at);
      const now = new Date();
      return expiryDate > now;
    }

    // If no expiry date, subscription is active
    return true;
  } catch (error) {
    console.error('Error in hasActiveSubscription:', error);
    return false;
  }
}

/**
 * Get user's active subscription
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserSubscription:', error);
    return null;
  }
}

/**
 * Create a subscription for a user
 */
export async function createSubscription(
  userId: string,
  planName: string,
  planPrice: number,
  planId?: string
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  try {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_name: planName,
        plan_price: planPrice,
        plan_id: planId,
        status: 'active',
        payment_method: 'card',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return { success: false, error: error.message };
    }

    return { success: true, subscriptionId: data.id };
  } catch (error: any) {
    console.error('Error in createSubscription:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if user has completed onboarding steps
 */
export async function getOnboardingStatus(userId: string): Promise<{
  hasSubscription: boolean;
  hasBrief: boolean;
  isComplete: boolean;
}> {
  try {
    // Check subscription
    const hasSubscription = await hasActiveSubscription(userId);

    // Check if brief exists
    const { data: briefData } = await supabase
      .from('client_briefs')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const hasBrief = !!briefData;

    return {
      hasSubscription,
      hasBrief,
      isComplete: hasSubscription && hasBrief,
    };
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return {
      hasSubscription: false,
      hasBrief: false,
      isComplete: false,
    };
  }
}
