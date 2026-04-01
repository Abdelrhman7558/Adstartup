import { supabase } from '../supabase';

export interface AdAccount {
    id: string;
    name: string;
    account_id: string;
    account_status: number;
}

export interface CampaignData {
    id: string;
    name: string;
    status: string;
    objective?: string;
    daily_budget?: number;
}

export interface AdSetData {
    id: string;
    name: string;
    status: string;
}

export interface CreativeData {
    id: string;
    name: string;
    image_url?: string;
    thumbnail_url?: string;
}

export interface PixelData {
    id: string;
    name: string;
}

export interface CatalogData {
    id: string;
    name: string;
}

/**
 * Helper to securely invoke Supabase Edge functions with session tokens
 */
async function invokeSecureMetaAPI<T>(functionName: string, body: any = {}): Promise<T> {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
        throw new Error('Unauthorized: Session expired or invalid.');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase configuration missing.');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': anonKey,
        },
        body: JSON.stringify(body),
    });

    const responseText = await response.text();
    let data: any;

    try {
        data = JSON.parse(responseText);
    } catch {
        throw new Error(`Server returned unexpected response (status ${response.status})`);
    }

    if (!response.ok || data?.success === false) {
        throw new Error(data?.error || data?.message || `Meta API Error (${response.status})`);
    }

    return data.data as T;
}

export const metaAdsService = {
    /**
     * Fetches the users connected Ad Accounts securely.
     */
    async getAdAccounts(): Promise<AdAccount[]> {
        return invokeSecureMetaAPI<AdAccount[]>('get-ad-accounts');
    },

    /**
     * Fetches campaigns for a given Ad Account ID
     */
    async getCampaigns(adAccountId: string): Promise<CampaignData[]> {
        return invokeSecureMetaAPI<CampaignData[]>('get-campaigns', { ad_account_id: adAccountId });
    },

    /**
     * Fetches Ad Sets for a given Campaign ID
     */
    async getAdSets(campaignId: string): Promise<AdSetData[]> {
        return invokeSecureMetaAPI<AdSetData[]>('get-ad-sets', { campaign_id: campaignId });
    },

    /**
     * Fetches creatives for a given Ad Account ID
     */
    async getCreatives(adAccountId: string): Promise<CreativeData[]> {
        return invokeSecureMetaAPI<CreativeData[]>('get-creatives', { ad_account_id: adAccountId });
    },

    /**
     * Fetches Pixels for the connected business/user
     */
    async getPixels(): Promise<PixelData[]> {
        return invokeSecureMetaAPI<PixelData[]>('get-pixels');
    },

    /**
     * Fetches Catalogs for the connected business/user
     */
    async getCatalogs(): Promise<CatalogData[]> {
        return invokeSecureMetaAPI<CatalogData[]>('get-catalogs');
    }
};
