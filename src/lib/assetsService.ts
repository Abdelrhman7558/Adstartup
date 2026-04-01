import { supabase } from './supabase';

export interface Asset {
  id: string;
  user_id: string;
  workspace_id: string;
  asset_type: 'image' | 'video' | 'copy' | 'testimonial';
  asset_url?: string;
  asset_text?: string;
  file_name?: string;
  file_size?: number;
  status: 'uploaded' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export async function fetchUserAssets(userId: string, workspaceId: string): Promise<Asset[]> {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching assets:', error);
    return [];
  }
}

export async function createAsset(
  userId: string,
  workspaceId: string,
  assetType: Asset['asset_type'],
  content: { url?: string; text?: string; fileName?: string; fileSize?: number }
): Promise<{ asset?: Asset; error?: Error }> {
  try {
    const { data, error } = await supabase
      .from('assets')
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        asset_type: assetType,
        asset_url: content.url || null,
        asset_text: content.text || null,
        file_name: content.fileName || null,
        file_size: content.fileSize || null,
        status: 'uploaded',
      })
      .select()
      .single();

    if (error) throw error;
    return { asset: data };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function deleteAsset(assetId: string): Promise<{ error?: Error }> {
  try {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId);

    if (error) throw error;
    return {};
  } catch (error) {
    return { error: error as Error };
  }
}

export async function updateAssetStatus(
  assetId: string,
  status: Asset['status']
): Promise<{ error?: Error }> {
  try {
    const { error } = await supabase
      .from('assets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', assetId);

    if (error) throw error;
    return {};
  } catch (error) {
    return { error: error as Error };
  }
}

export async function getDefaultWorkspace(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('workspaces')
      .select('id')
      .eq('user_id', userId)
      .eq('is_default', true)
      .maybeSingle();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('Error fetching default workspace:', error);
    return null;
  }
}
