import { supabase } from './supabase';

export interface CampaignAsset {
  id: string;
  campaign_id: string;
  user_id: string;
  asset_name: string;
  file_type?: string;
  storage_path: string;
  public_url: string;
  uploaded_at: string;
}

export const campaignAssetsService = {
  async uploadAsset(
    userId: string,
    campaignId: string,
    campaignName: string,
    file: File
  ): Promise<CampaignAsset> {
    if (!campaignId) {
      throw new Error('Campaign ID is required for asset upload');
    }

    if (!file || file.size === 0) {
      throw new Error(`Invalid file: ${file.name}`);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${file.name}`;
    const storagePath = `${userId}/${campaignName}/${fileName}`;

    // Upload with 30 second timeout
    try {
      const uploadPromise = supabase.storage
        .from('assets')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
      );

      const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Storage upload error';
      throw new Error(`Failed to upload file to storage: ${msg}`);
    }

    let publicUrl = '';
    try {
      const { data: publicUrlData } = supabase.storage
        .from('assets')
        .getPublicUrl(storagePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Could not generate public URL');
      }
      publicUrl = publicUrlData.publicUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'URL generation error';
      throw new Error(`Failed to generate public URL: ${msg}`);
    }

    try {
      // Use MIME type from the file object (e.g., "video/mp4", "image/jpeg")
      // If not available, construct it from extension
      let mimeType = file.type;
      if (!mimeType && fileExt) {
        // Fallback: construct MIME type from extension
        const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

        if (videoExts.includes(fileExt.toLowerCase())) {
          mimeType = `video/${fileExt.toLowerCase()}`;
        } else if (imageExts.includes(fileExt.toLowerCase())) {
          mimeType = `image/${fileExt.toLowerCase()}`;
        } else {
          mimeType = `application/${fileExt.toLowerCase()}`;
        }
      }

      const { data, error } = await supabase
        .from('campaign_assets')
        .insert([
          {
            campaign_id: campaignId,
            user_id: userId,
            asset_name: file.name,
            file_type: mimeType,
            storage_path: storagePath,
            public_url: publicUrl,
          },
        ])
        .select()
        .single();

      console.log('[campaignAssetsService] Database insert result:', { data, error });

      if (error) {
        console.error('[campaignAssetsService] Database insert failed:', error);
        throw new Error(`Database insert error: ${error.message}`);
      }

      if (!data) {
        console.error('[campaignAssetsService] No data returned from insert');
        throw new Error('No data returned from database insert');
      }

      console.log('[campaignAssetsService] Asset saved successfully to campaign_assets:', data.id);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Database error';
      throw new Error(`Failed to save asset to database: ${msg}`);
    }
  },

  async linkExistingAsset(
    userId: string,
    campaignId: string,
    campaignName: string,
    assetId: string
  ): Promise<CampaignAsset> {
    if (!campaignId) {
      throw new Error('Campaign ID is required to link asset');
    }

    if (!assetId) {
      throw new Error('Asset ID is required');
    }

    let existingAsset;
    try {
      const { data, error: fetchError } = await supabase
        .from('use_asset')
        .select('*')
        .eq('id', assetId)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Failed to fetch asset: ${fetchError.message}`);
      }

      if (!data) {
        throw new Error('Asset not found in database');
      }

      existingAsset = data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Asset fetch error';
      throw new Error(`Could not find asset: ${msg}`);
    }

    try {
      const { data, error } = await supabase
        .from('campaign_assets')
        .insert([
          {
            campaign_id: campaignId,
            user_id: userId,
            asset_name: existingAsset.file_name,
            file_type: existingAsset.file_type,
            storage_path: existingAsset.storage_path,
            public_url: existingAsset.public_url || '',
          },
        ])
        .select()
        .single();

      if (error) {
        throw new Error(`Database insert error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from link operation');
      }

      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Database error';
      throw new Error(`Failed to link asset to campaign: ${msg}`);
    }
  },

  async getCampaignAssets(userId: string, campaignId: string): Promise<CampaignAsset[]> {
    const { data, error } = await supabase
      .from('campaign_assets')
      .select('*')
      .eq('user_id', userId)
      .eq('campaign_id', campaignId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAssetsByCampaignName(userId: string, campaignName: string): Promise<CampaignAsset[]> {
    const { data: campaigns, error: campaignError } = await supabase
      .from('marketing_campaigns')
      .select('campaign_id')
      .eq('user_id', userId)
      .eq('campaign_name', campaignName)
      .maybeSingle();

    if (campaignError) throw campaignError;
    if (!campaigns) return [];

    return this.getCampaignAssets(userId, campaigns.campaign_id);
  },

  async getAllCampaignFolders(userId: string): Promise<{ campaign_id: string; campaign_name: string; asset_count: number }[]> {
    const { data: campaigns, error: campaignsError } = await supabase
      .from('marketing_campaigns')
      .select('campaign_id, campaign_name')
      .eq('user_id', userId);

    if (campaignsError) throw campaignsError;
    if (!campaigns) return [];

    const foldersWithCounts = await Promise.all(
      campaigns.map(async (campaign) => {
        const { data: assets } = await supabase
          .from('campaign_assets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('campaign_id', campaign.campaign_id);

        return {
          campaign_id: campaign.campaign_id,
          campaign_name: campaign.campaign_name,
          asset_count: assets?.length || 0,
        };
      })
    );

    return foldersWithCounts.filter(f => f.asset_count > 0);
  },

  async deleteAsset(userId: string, assetId: string): Promise<void> {
    const { data: asset, error: fetchError } = await supabase
      .from('campaign_assets')
      .select('storage_path')
      .eq('id', assetId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!asset) throw new Error('Asset not found');

    await supabase.storage.from('assets').remove([asset.storage_path]);

    const { error } = await supabase
      .from('campaign_assets')
      .delete()
      .eq('id', assetId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};
