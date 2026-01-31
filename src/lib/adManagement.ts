import { supabase, Ad, AdAction } from './supabase';

export type AdActionType = 'kill' | 'remove' | 'pause' | 'activate';

interface AdWithAction extends Ad {
  lastAction?: AdAction;
}

export async function fetchAds(userId: string): Promise<Ad[]> {
  try {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[Ads] Error fetching ads:', err);
    throw err;
  }
}

export async function fetchAdById(userId: string, adId: string): Promise<Ad | null> {
  try {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('user_id', userId)
      .eq('id', adId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Ads] Error fetching ad:', err);
    throw err;
  }
}

export async function createAd(
  userId: string,
  name: string,
  createdBy: 'manual' | 'api' | 'meta' = 'manual'
): Promise<Ad> {
  try {
    const { data, error } = await supabase
      .from('ads')
      .insert([
        {
          user_id: userId,
          name,
          created_by: createdBy,
          status: 'active',
          metadata: {},
        },
      ])
      .select()
      .single();

    if (error) throw error;
    console.log('[Ads] Created ad:', name);
    return data;
  } catch (err) {
    console.error('[Ads] Error creating ad:', err);
    throw err;
  }
}

export async function updateAdStatus(
  userId: string,
  adId: string,
  status: Ad['status']
): Promise<Ad> {
  try {
    const { data, error } = await supabase
      .from('ads')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('id', adId)
      .select()
      .single();

    if (error) throw error;
    console.log('[Ads] Updated ad status:', adId, status);
    return data;
  } catch (err) {
    console.error('[Ads] Error updating ad status:', err);
    throw err;
  }
}

export async function logAdAction(
  userId: string,
  adId: string,
  actionType: AdActionType,
  actionReason?: string
): Promise<AdAction> {
  try {
    const { data, error } = await supabase
      .from('ad_actions')
      .insert([
        {
          user_id: userId,
          ad_id: adId,
          action_type: actionType,
          action_reason: actionReason,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    console.log('[Ads] Logged action:', actionType, 'for ad:', adId);
    return data;
  } catch (err) {
    console.error('[Ads] Error logging action:', err);
    throw err;
  }
}

export async function updateActionStatus(
  userId: string,
  actionId: string,
  status: 'pending' | 'completed' | 'failed',
  errorMessage?: string
): Promise<AdAction> {
  try {
    const updates: Record<string, any> = {
      status,
    };

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    const { data, error } = await supabase
      .from('ad_actions')
      .update(updates)
      .eq('id', actionId)
      .select()
      .single();

    if (error) throw error;
    console.log('[Ads] Updated action status:', actionId, status);
    return data;
  } catch (err) {
    console.error('[Ads] Error updating action status:', err);
    throw err;
  }
}

export async function triggerAdAction(
  userId: string,
  adId: string,
  actionType: AdActionType,
  reason?: string
): Promise<void> {
  try {
    const ad = await fetchAdById(userId, adId);
    if (!ad) throw new Error('Ad not found');

    const newStatus: Ad['status'] = actionType === 'kill' ? 'deleted' : 'paused';
    await updateAdStatus(userId, adId, newStatus);

    const action = await logAdAction(userId, adId, actionType, reason);
    console.log('[Ads] Triggered action:', actionType, 'for ad:', ad.name);

    return;
  } catch (err) {
    console.error('[Ads] Error triggering action:', err);
    throw err;
  }
}

export async function killAllAds(userId: string): Promise<Ad[]> {
  try {
    const ads = await fetchAds(userId);
    const activeAds = ads.filter((ad) => ad.status === 'active');

    for (const ad of activeAds) {
      await updateAdStatus(userId, ad.id, 'deleted');
      await logAdAction(userId, ad.id, 'kill', 'bulk_kill_all');
    }

    console.log('[Ads] Killed', activeAds.length, 'ads');
    return activeAds;
  } catch (err) {
    console.error('[Ads] Error killing all ads:', err);
    throw err;
  }
}

export async function getAdStats(userId: string): Promise<{
  total: number;
  active: number;
  paused: number;
  disabled: number;
  deleted: number;
}> {
  try {
    const ads = await fetchAds(userId);

    return {
      total: ads.length,
      active: ads.filter((a) => a.status === 'active').length,
      paused: ads.filter((a) => a.status === 'paused').length,
      disabled: ads.filter((a) => a.status === 'disabled').length,
      deleted: ads.filter((a) => a.status === 'deleted').length,
    };
  } catch (err) {
    console.error('[Ads] Error getting stats:', err);
    throw err;
  }
}
