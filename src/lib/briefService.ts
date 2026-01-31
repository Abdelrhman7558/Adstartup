import { supabase } from './supabase';

export interface BriefData {
  businessName?: string;
  industry?: string;
  targetAudience?: string;
  campaignGoal?: string;
  budget?: number;
  duration?: string;
  productDescription?: string;
  uniqueSellingPoints?: string;
  competitorInfo?: string;
  brandGuidelines?: string;
  [key: string]: any;
}

export interface UserBrief {
  id: string;
  user_id: string;
  version_number: number;
  data: BriefData;
  created_at: string;
}

export async function getLatestBrief(userId: string): Promise<UserBrief | null> {
  try {
    const { data, error } = await supabase
      .from('user_briefs')
      .select('*')
      .eq('user_id', userId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching latest brief:', error);
    return null;
  }
}

export async function getAllBriefVersions(userId: string): Promise<UserBrief[]> {
  try {
    const { data, error } = await supabase
      .from('user_briefs')
      .select('*')
      .eq('user_id', userId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching brief versions:', error);
    return [];
  }
}

export async function createBriefVersion(
  userId: string,
  briefData: BriefData
): Promise<{ brief?: UserBrief; error?: Error }> {
  try {
    const { data, error } = await supabase
      .from('user_briefs')
      .insert({
        user_id: userId,
        data: briefData,
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Mark brief as completed in users table
    await supabase
      .from('users')
      .update({
        brief_completed: true,
        brief_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return { brief: data };
  } catch (error) {
    console.error('Error creating brief version:', error);
    return { error: error as Error };
  }
}

export async function getBriefVersion(
  userId: string,
  versionNumber: number
): Promise<UserBrief | null> {
  try {
    const { data, error } = await supabase
      .from('user_briefs')
      .select('*')
      .eq('user_id', userId)
      .eq('version_number', versionNumber)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching brief version:', error);
    return null;
  }
}
