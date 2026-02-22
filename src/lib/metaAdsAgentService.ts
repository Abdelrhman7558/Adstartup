/**
 * Meta Ads Agent Service
 * 
 * Aggregates data from meta_connections, client_briefs, and campaign_assets
 * to build a unified payload for the Meta Ads Media Buyer AI Agent.
 * 
 * The agent follows the T.O.S (Testing → Optimization → Scaling) framework.
 */

import { supabase } from './supabase';

// ─── Types ──────────────────────────────────────────────────────

export interface MetaConnectionData {
    ad_account_id: string | null;
    pixel_id: string | null;
    catalog_id: string | null;
    catalog_name: string | null;
    page_id: string | null;
    page_name: string | null;
    access_token: string | null;
}

export interface ClientBriefData {
    business_name: string;
    website_url: string | null;
    business_type: string;
    industry_niche: string;
    industry: string | null;
    operating_countries: string;
    selling_languages: string;
    business_model: string;
    business_age: string;
    usp: string;
    brand_tone: string[];
    restricted_content: string;
    advertising_what: string;
    product_description: string;
    currency: string;
    aov: number;
    gross_margin: number | null;
    has_discount: boolean;
    discount_details: string | null;
    offer_type: string;
    payment_methods: string[];
    shipping_info: string;
    refund_policy: string;
    social_proof: string[];
    primary_goal: string;
    secondary_goal: string | null;
    funnel_stage: string;
    campaign_type: string;
    has_run_meta_ads: boolean;
    monthly_ad_spend: string | null;
    best_campaign_type: string | null;
    best_creatives: string | null;
    best_audience_type: string | null;
    average_cpa: number | null;
    average_roas: number | null;
    past_issues: string | null;
    target_locations: string;
    age_range: string;
    gender: string;
    ideal_customer: string;
    interests_behaviors: string;
    preferred_angles: string[];
    competitors_to_avoid: string | null;
    brand_guidelines: string | null;
    ad_copy_tone: string;
    daily_budget: number;
    risk_tolerance: string;
    campaign_launch: string;
    target_audience: string | null;
    campaign_objective: string | null;
    competitors: string | null;
    ad_tone: string | null;
    preferred_platforms: string | null;
    budget: number | null;
    duration: string | null;
}

export interface AssetData {
    id: string;
    file_name: string;
    file_type: string;
    file_url: string;
    storage_path: string;
}

export interface CampaignFormData {
    campaign_id: string;
    campaign_name: string;
    objective: string;
    goal: string;
    daily_budget: number;
    currency: string;
    start_time: string;
    end_time: string | null;
    description: string;
    offer: string | null;
    asset_type: 'catalog' | 'upload';
    selected_catalog_id?: string;
    selected_catalog_name?: string;
    selected_page_id?: string;
    selected_page_name?: string;
    account_id?: string;
    account_name?: string;
}

export interface MetaAdsAgentPayload {
    user_id: string;
    campaign_id: string;
    campaign_name: string;
    objective: string;
    goal: string;
    daily_budget: number;
    currency: string;
    start_time: string;
    end_time: string | null;
    description: string;
    offer: string | null;
    meta_connection: MetaConnectionData;
    brief: Partial<ClientBriefData>;
    asset_type: 'catalog' | 'upload';
    assets: AssetData[];
    catalog_id: string | null;
    catalog_name: string | null;
    page_id: string | null;
    page_name: string | null;
    account_id: string | null;
    account_name: string | null;
    agent_mode: 'TEST_MODE' | 'OPTIMIZE_MODE' | 'SCALE_MODE' | 'HOLD_MODE';
    timestamp: string;
}

// ─── Data Fetching Functions ────────────────────────────────────

/**
 * Fetch Meta connection data for a user from meta_connections table
 */
export async function fetchMetaConnection(userId: string): Promise<MetaConnectionData | null> {
    try {
        console.log('[MetaAdsAgent] Fetching meta connection for user:', userId);

        const { data, error } = await supabase
            .from('meta_connections')
            .select('ad_account_id, pixel_id, catalog_id, catalog_name, page_id, page_name, access_token')
            .eq('user_id', userId)
            .eq('is_connected', true)
            .maybeSingle();

        if (error) {
            console.error('[MetaAdsAgent] Error fetching meta connection:', error);
            return null;
        }

        if (!data) {
            console.warn('[MetaAdsAgent] No connected meta account found for user');
            return null;
        }

        console.log('[MetaAdsAgent] Meta connection fetched:', {
            ad_account_id: data.ad_account_id,
            pixel_id: data.pixel_id,
            catalog_id: data.catalog_id,
            page_id: data.page_id,
            has_access_token: !!data.access_token,
        });

        return {
            ad_account_id: data.ad_account_id || null,
            pixel_id: data.pixel_id || null,
            catalog_id: data.catalog_id || null,
            catalog_name: data.catalog_name || null,
            page_id: data.page_id || null,
            page_name: data.page_name || null,
            access_token: data.access_token || null,
        };
    } catch (err) {
        console.error('[MetaAdsAgent] Exception fetching meta connection:', err);
        return null;
    }
}

/**
 * Fetch client brief data for a user from client_briefs table
 */
export async function fetchClientBrief(userId: string): Promise<Partial<ClientBriefData> | null> {
    try {
        console.log('[MetaAdsAgent] Fetching client brief for user:', userId);

        const { data, error } = await supabase
            .from('client_briefs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('[MetaAdsAgent] Error fetching client brief:', error);
            return null;
        }

        if (!data) {
            console.warn('[MetaAdsAgent] No client brief found for user');
            return null;
        }

        console.log('[MetaAdsAgent] Client brief fetched:', data.business_name || 'Unknown business');

        // Return all brief fields (excluding id, user_id, timestamps)
        const { id, user_id, created_at, updated_at, ...briefData } = data;
        return briefData as Partial<ClientBriefData>;
    } catch (err) {
        console.error('[MetaAdsAgent] Exception fetching client brief:', err);
        return null;
    }
}

/**
 * Fetch campaign assets from campaign_assets table by campaign_id
 */
export async function fetchCampaignAssets(userId: string, campaignId: string): Promise<AssetData[]> {
    try {
        console.log('[MetaAdsAgent] Fetching campaign assets for campaign:', campaignId);

        const { data, error } = await supabase
            .from('campaign_assets')
            .select('id, asset_name, file_type, public_url, storage_path')
            .eq('user_id', userId)
            .eq('campaign_id', campaignId)
            .order('uploaded_at', { ascending: false });

        if (error) {
            console.error('[MetaAdsAgent] Error fetching campaign assets:', error);
            return [];
        }

        const assets: AssetData[] = (data || []).map(item => ({
            id: item.id,
            file_name: item.asset_name || '',
            file_type: item.file_type || '',
            file_url: item.public_url || '',
            storage_path: item.storage_path || '',
        }));

        console.log('[MetaAdsAgent] Campaign assets fetched:', assets.length);
        return assets;
    } catch (err) {
        console.error('[MetaAdsAgent] Exception fetching campaign assets:', err);
        return [];
    }
}

/**
 * Fetch standalone assets (from use_asset table) for a user
 * Used when user selects "Assets" from the assets tab
 */
export async function fetchUserStandaloneAssets(userId: string): Promise<AssetData[]> {
    try {
        console.log('[MetaAdsAgent] Fetching standalone assets for user:', userId);

        const { data, error } = await supabase
            .from('use_asset')
            .select('id, file_name, file_type, public_url, storage_path')
            .eq('user_id', userId)
            .order('uploaded_at', { ascending: false });

        if (error) {
            console.error('[MetaAdsAgent] Error fetching standalone assets:', error);
            return [];
        }

        const assets: AssetData[] = (data || []).map(item => ({
            id: item.id,
            file_name: item.file_name || '',
            file_type: item.file_type || '',
            file_url: item.public_url || '',
            storage_path: item.storage_path || '',
        }));

        console.log('[MetaAdsAgent] Standalone assets fetched:', assets.length);
        return assets;
    } catch (err) {
        console.error('[MetaAdsAgent] Exception fetching standalone assets:', err);
        return [];
    }
}

// ─── Main Agent Functions ───────────────────────────────────────

/**
 * Gather all data needed for the Meta Ads Agent and build the payload
 */
export async function buildAgentPayload(
    userId: string,
    campaignForm: CampaignFormData
): Promise<{ payload: MetaAdsAgentPayload | null; error: string | null }> {
    try {
        console.log('[MetaAdsAgent] Building agent payload for user:', userId);

        // 1. Fetch Meta connection data
        const metaConnection = await fetchMetaConnection(userId);
        if (!metaConnection) {
            return {
                payload: null,
                error: 'No connected Meta account found. Please connect your Meta account first.',
            };
        }

        if (!metaConnection.ad_account_id) {
            return {
                payload: null,
                error: 'No Ad Account ID found. Please select an Ad Account in your Meta connection settings.',
            };
        }

        if (!metaConnection.access_token) {
            return {
                payload: null,
                error: 'No access token found. Please reconnect your Meta account.',
            };
        }

        // 2. Fetch client brief
        const brief = await fetchClientBrief(userId);
        if (!brief) {
            console.warn('[MetaAdsAgent] No brief found — proceeding without brief data');
        }

        // 3. Fetch assets (if upload type)
        let assets: AssetData[] = [];
        if (campaignForm.asset_type === 'upload') {
            assets = await fetchCampaignAssets(userId, campaignForm.campaign_id);
        }

        // 4. Build the complete payload
        const payload: MetaAdsAgentPayload = {
            user_id: userId,
            campaign_id: campaignForm.campaign_id,
            campaign_name: campaignForm.campaign_name,
            objective: campaignForm.objective,
            goal: campaignForm.goal,
            daily_budget: campaignForm.daily_budget,
            currency: campaignForm.currency,
            start_time: campaignForm.start_time,
            end_time: campaignForm.end_time,
            description: campaignForm.description,
            offer: campaignForm.offer,

            // Meta connection data (auto-pulled)
            meta_connection: metaConnection,

            // Brief data (auto-pulled)
            brief: brief || {},

            // Assets
            asset_type: campaignForm.asset_type,
            assets: assets,

            // Catalog info
            catalog_id: campaignForm.asset_type === 'catalog'
                ? (campaignForm.selected_catalog_id || metaConnection.catalog_id)
                : null,
            catalog_name: campaignForm.asset_type === 'catalog'
                ? (campaignForm.selected_catalog_name || metaConnection.catalog_name)
                : null,

            // Page info
            page_id: campaignForm.selected_page_id || metaConnection.page_id,
            page_name: campaignForm.selected_page_name || metaConnection.page_name,

            // Manager account info
            account_id: campaignForm.account_id || null,
            account_name: campaignForm.account_name || null,

            // Agent control
            agent_mode: 'TEST_MODE',
            timestamp: new Date().toISOString(),
        };

        console.log('[MetaAdsAgent] Payload built successfully:', {
            campaign_name: payload.campaign_name,
            has_meta_connection: !!payload.meta_connection.ad_account_id,
            has_brief: Object.keys(payload.brief).length > 0,
            assets_count: payload.assets.length,
            agent_mode: payload.agent_mode,
        });

        return { payload, error: null };
    } catch (err) {
        console.error('[MetaAdsAgent] Error building agent payload:', err);
        return {
            payload: null,
            error: err instanceof Error ? err.message : 'Failed to build agent payload',
        };
    }
}

/**
 * Create campaign directly on Meta via Supabase Edge Function.
 * Replaces the old n8n webhook approach.
 */
export async function createMetaCampaign(payload: MetaAdsAgentPayload): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: {
        meta_campaign_id: string;
        meta_adset_id: string;
        meta_creative_id: string;
        meta_ad_id: string;
    };
}> {
    try {
        console.log('[MetaAdsAgent] Creating campaign via Meta API...', {
            user_id: payload.user_id,
            campaign_name: payload.campaign_name,
            ad_account_id: payload.meta_connection.ad_account_id,
            has_access_token: !!payload.meta_connection.access_token,
            brief_business: (payload.brief as any)?.business_name || 'N/A',
            assets_count: payload.assets.length,
            asset_type: payload.asset_type,
        });

        const { data, error } = await supabase.functions.invoke('create-meta-campaign', {
            body: payload,
        });

        if (error) {
            console.error('[MetaAdsAgent] Edge function error:', error);
            return {
                success: false,
                error: error.message || 'Failed to create campaign on Meta',
            };
        }

        if (data?.error) {
            console.error('[MetaAdsAgent] Meta API error:', data.error);
            return {
                success: false,
                error: data.error,
            };
        }

        console.log('[MetaAdsAgent] Campaign created on Meta:', data);

        return {
            success: true,
            message: data?.message || 'Campaign created successfully on Meta!',
            data: data?.data,
        };
    } catch (err: any) {
        let errorMessage = err.message || 'Failed to create campaign on Meta';

        if (err.message === 'Failed to fetch') {
            errorMessage = 'Network error: Unable to reach the server. Check your connection.';
        }

        console.error('[MetaAdsAgent] Error creating campaign:', errorMessage);
        return {
            success: false,
            error: errorMessage,
        };
    }
}

