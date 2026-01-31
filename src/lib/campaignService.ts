import { supabase } from './supabase';

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  objective?: string;
  goal?: string;
  daily_budget?: number;
  description?: string;
  page_id?: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  asset_count?: number;
}

export interface CampaignAsset {
  id: string;
  user_id: string;
  campaign_id: string | null;
  campaign_name: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url: string | null;
  uploaded_at: string;
}

export async function getUserCampaigns(userId: string): Promise<Campaign[]> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
}

export async function createCampaign(
  userId: string,
  campaignName: string,
  objective: string,
  goal: string,
  dailyBudget?: number,
  description?: string,
  pageId?: string
): Promise<{ campaign?: Campaign; error?: Error }> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        user_id: userId,
        name: campaignName,
        objective: objective || null,
        goal: goal || null,
        daily_budget: dailyBudget || null,
        description: description || null,
        page_id: pageId || null,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: null,
      })
      .select()
      .single();

    if (error) throw error;
    return { campaign: data };
  } catch (error) {
    console.error('Error creating campaign:', error);
    return { error: error as Error };
  }
}

export async function updateCampaignStatus(
  campaignId: string,
  status: string
): Promise<{ error?: Error }> {
  try {
    const { error } = await supabase
      .from('campaigns')
      .update({ status })
      .eq('id', campaignId);

    if (error) throw error;
    return {};
  } catch (error) {
    console.error('Error updating campaign status:', error);
    return { error: error as Error };
  }
}

export async function getAllAssetsGroupedByCampaign(userId: string): Promise<Map<string, CampaignAsset[]>> {
  try {
    const { data, error } = await supabase
      .from('use_asset')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    const grouped = new Map<string, CampaignAsset[]>();

    (data || []).forEach((asset) => {
      const campaignName = asset.campaign_name || 'Uncategorized';
      if (!grouped.has(campaignName)) {
        grouped.set(campaignName, []);
      }
      grouped.get(campaignName)!.push(asset);
    });

    return grouped;
  } catch (error) {
    console.error('Error fetching grouped assets:', error);
    return new Map();
  }
}

export async function uploadCampaignAssets(
  userId: string,
  campaignId: string,
  campaignName: string,
  campaignStartDate: Date | null,
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<{ successCount: number; totalFiles: number; errors: string[] }> {
  let successCount = 0;
  const totalFiles = files.length;
  const errors: string[] = [];

  const dateString = campaignStartDate
    ? campaignStartDate.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      if (!(file instanceof File) || file.size === 0) {
        errors.push(`Invalid file: ${file.name}`);
        onProgress?.(i + 1, totalFiles);
        continue;
      }

      const timestamp = new Date().getTime();
      const storagePath = `user_assets/${userId}/campaigns/${campaignName}_${dateString}/${timestamp}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('user_assets')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        errors.push(`Upload failed for ${file.name}: ${uploadError.message}`);
        onProgress?.(i + 1, totalFiles);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('user_assets')
        .getPublicUrl(storagePath);

      const publicUrl = urlData?.publicUrl || null;

      const { error: dbError } = await supabase
        .from('use_asset')
        .insert({
          user_id: userId,
          campaign_id: campaignId,
          campaign_name: campaignName,
          file_name: file.name,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
          storage_path: storagePath,
          public_url: publicUrl,
        });

      if (dbError) {
        errors.push(`Database error for ${file.name}: ${dbError.message}`);
        await supabase.storage.from('user_assets').remove([storagePath]);
      } else {
        successCount++;
      }

      onProgress?.(i + 1, totalFiles);
    } catch (err) {
      errors.push(`Error processing ${file.name}: ${err}`);
      onProgress?.(i + 1, totalFiles);
    }
  }

  return { successCount, totalFiles, errors };
}

export async function uploadStandaloneAssets(
  userId: string,
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<{ successCount: number; totalFiles: number; errors: string[] }> {
  let successCount = 0;
  const totalFiles = files.length;
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      if (!(file instanceof File) || file.size === 0) {
        errors.push(`Invalid file: ${file.name}`);
        onProgress?.(i + 1, totalFiles);
        continue;
      }

      const timestamp = new Date().getTime();
      const storagePath = `user_assets/${userId}/standalone_assets/${timestamp}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('user_assets')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        errors.push(`Upload failed for ${file.name}: ${uploadError.message}`);
        onProgress?.(i + 1, totalFiles);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('user_assets')
        .getPublicUrl(storagePath);

      const publicUrl = urlData?.publicUrl || null;

      const { error: dbError } = await supabase
        .from('use_asset')
        .insert({
          user_id: userId,
          campaign_id: null,
          campaign_name: null,
          file_name: file.name,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
          storage_path: storagePath,
          public_url: publicUrl,
        });

      if (dbError) {
        errors.push(`Database error for ${file.name}: ${dbError.message}`);
        await supabase.storage.from('user_assets').remove([storagePath]);
      } else {
        successCount++;
      }

      onProgress?.(i + 1, totalFiles);
    } catch (err) {
      errors.push(`Error processing ${file.name}: ${err}`);
      onProgress?.(i + 1, totalFiles);
    }
  }

  return { successCount, totalFiles, errors };
}

export async function getStandaloneAssets(userId: string): Promise<CampaignAsset[]> {
  try {
    const { data, error } = await supabase
      .from('use_asset')
      .select('*')
      .eq('user_id', userId)
      .is('campaign_id', null)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching standalone assets:', error);
    return [];
  }
}

export async function getCampaignAssets(userId: string, campaignId: string): Promise<CampaignAsset[]> {
  try {
    const { data, error } = await supabase
      .from('use_asset')
      .select('*')
      .eq('user_id', userId)
      .eq('campaign_id', campaignId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching campaign assets:', error);
    return [];
  }
}

export async function deleteCampaign(userId: string, campaignId: string, campaignName: string): Promise<{ error?: Error }> {
  try {
    const { data: assets, error: assetsError } = await supabase
      .from('use_asset')
      .select('storage_path')
      .eq('user_id', userId)
      .eq('campaign_id', campaignId);

    if (assetsError) throw assetsError;

    if (assets && assets.length > 0) {
      const storagePaths = assets.map(a => a.storage_path);

      const { error: storageError } = await supabase.storage
        .from('user_assets')
        .remove(storagePaths);

      if (storageError) {
        console.warn('Warning: Some files could not be deleted from storage:', storageError);
      }
    }

    const { error: dbError } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId)
      .eq('user_id', userId);

    if (dbError) throw dbError;

    return {};
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return { error: error as Error };
  }
}

export async function deleteStandaloneAsset(userId: string, assetId: string, storagePath: string): Promise<{ error?: Error }> {
  try {
    const { error: storageError } = await supabase.storage
      .from('user_assets')
      .remove([storagePath]);

    if (storageError) {
      console.warn('Warning: File could not be deleted from storage:', storageError);
    }

    const { error: dbError } = await supabase
      .from('use_asset')
      .delete()
      .eq('id', assetId)
      .eq('user_id', userId);

    if (dbError) throw dbError;

    return {};
  } catch (error) {
    console.error('Error deleting asset:', error);
    return { error: error as Error };
  }
}
