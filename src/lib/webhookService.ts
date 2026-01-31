// Webhook integration service for dashboard data
import { validateUserId, webhookGet, webhookPost, logWebhookCall, WebhookValidationError } from './webhookUtils';

const WEBHOOK_BASE = 'https://n8n.srv1181726.hstgr.cloud/webhook';

export interface CampaignData {
  id: string;
  name: string;
  status: string;
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  conversions: number;
  profit?: number;
  roas?: number;
}

export interface AdData {
  id: string;
  ad_name: string;
  profit: number;
  loss: number;
  impressions: number;
  spend: number;
  revenue: number;
  status: string;
}

export interface DashboardMetrics {
  totalCampaigns: number;
  activeAds: number;
  totalSpend: number;
  totalRevenue: number;
  totalProfit: number;
  totalImpressions: number;
  averageRoas: number;
  salesTrend?: Array<{ date: string; sales: number }>;
}

export interface AddCampaignPayload {
  user_id: string;
  campaign_name: string;
  campaign_objective: string;
  target_country: string;
  daily_budget: number;
  campaign_notes?: string;
  files?: Array<{
    file_name: string;
    file_size: number;
    file_type: string;
    storage_path: string;
  }>;
  timestamp: string;
}

/**
 * Fetch campaigns data from webhook
 * REQUIRED: userId must be provided for user-level data isolation
 */
export async function fetchCampaignsData(userId: string): Promise<CampaignData[]> {
  try {
    const validatedUserId = validateUserId(userId);
    const url = `${WEBHOOK_BASE}/campaigns-analysis`;

    const data = await webhookGet(url, validatedUserId);

    logWebhookCall('GET', 'campaigns-analysis', validatedUserId, true);

    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data.campaigns && Array.isArray(data.campaigns)) {
      return data.campaigns;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    }

    return [];
  } catch (error) {
    if (error instanceof WebhookValidationError) {
      console.error('[fetchCampaignsData] Validation error:', error.message);
    } else {
      console.error('Error fetching campaigns data:', error);
    }
    logWebhookCall('GET', 'campaigns-analysis', userId || 'MISSING', false, { error: String(error) });
    return [];
  }
}

/**
 * Fetch ads data from webhook
 * REQUIRED: userId must be provided for user-level data isolation
 */
export async function fetchAdsData(userId: string): Promise<AdData[]> {
  try {
    const validatedUserId = validateUserId(userId);
    const url = `${WEBHOOK_BASE}/Ads-Anlaysis`;

    const data = await webhookGet(url, validatedUserId);

    logWebhookCall('GET', 'Ads-Anlaysis', validatedUserId, true);

    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data.ads && Array.isArray(data.ads)) {
      return data.ads;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    }

    return [];
  } catch (error) {
    if (error instanceof WebhookValidationError) {
      console.error('[fetchAdsData] Validation error:', error.message);
    } else {
      console.error('Error fetching ads data:', error);
    }
    logWebhookCall('GET', 'Ads-Anlaysis', userId || 'MISSING', false, { error: String(error) });
    return [];
  }
}

/**
 * Fetch other dashboard metrics from webhook
 * REQUIRED: userId must be provided for user-level data isolation
 */
export async function fetchDashboardMetrics(userId: string): Promise<DashboardMetrics | null> {
  try {
    const validatedUserId = validateUserId(userId);
    const url = `${WEBHOOK_BASE}/other-data`;

    const data = await webhookGet(url, validatedUserId);

    logWebhookCall('GET', 'other-data', validatedUserId, true);

    return {
      totalCampaigns: data.totalCampaigns || data.total_campaigns || 0,
      activeAds: data.activeAds || data.active_ads || 0,
      totalSpend: parseFloat(data.totalSpend || data.total_spend || 0),
      totalRevenue: parseFloat(data.totalRevenue || data.total_revenue || 0),
      totalProfit: parseFloat(data.totalProfit || data.total_profit || 0),
      totalImpressions: parseInt(data.totalImpressions || data.total_impressions || 0),
      averageRoas: parseFloat(data.averageRoas || data.average_roas || 0),
      salesTrend: data.salesTrend || data.sales_trend || [],
    };
  } catch (error) {
    if (error instanceof WebhookValidationError) {
      console.error('[fetchDashboardMetrics] Validation error:', error.message);
    } else {
      console.error('Error fetching dashboard metrics:', error);
    }
    logWebhookCall('GET', 'other-data', userId || 'MISSING', false, { error: String(error) });
    return null;
  }
}

/**
 * Send campaign ID to webhook immediately after campaign creation
 * VALIDATES: user_id and campaign_id must be present
 */
export async function sendCampaignIdWebhook(userId: string, campaignId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validatedUserId = validateUserId(userId);

    const url = 'https://n8n.srv1181726.hstgr.cloud/webhook/campaign-id';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: validatedUserId,
        campaign_id: campaignId,
        timestamp: new Date().toISOString()
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
    }

    logWebhookCall('POST', 'campaign-id', validatedUserId, true);

    return {
      success: true,
      message: 'Campaign ID sent successfully',
    };
  } catch (error: any) {
    let errorMessage = error.message || 'Failed to send campaign ID';

    if (error.name === 'AbortError') {
      errorMessage = 'Campaign ID webhook timed out after 10 seconds';
    } else if (error.message === 'Failed to fetch') {
      errorMessage = 'Network error: Unable to reach campaign-id webhook. Possible CORS issue.';
      console.error('[CORS ERROR] Campaign-id webhook blocked. Check n8n CORS settings.');
    }

    console.error('Error sending campaign ID to webhook:', error);
    logWebhookCall('POST', 'campaign-id', userId || 'MISSING', false, { error: errorMessage });
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send campaign data to webhook when user creates a campaign
 * VALIDATES: user_id must be present in payload
 */
export async function sendCampaignToWebhook(payload: AddCampaignPayload): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    // Validate user_id is present in payload
    const validatedUserId = validateUserId(payload.user_id);

    const url = 'https://n8n.srv1181726.hstgr.cloud/webhook-test/Add-Campain';

    // Add 10s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        user_id: validatedUserId,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
    }

    let result;
    const responseText = await response.text();
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      // If response is not JSON but status is OK, treat it as success
      console.warn('Webhook returned non-JSON response:', responseText);
      result = { message: 'Campaign sent successfully (non-JSON response)' };
    }

    logWebhookCall('POST', 'Add-Campain', validatedUserId, true);

    return {
      success: true,
      message: result.message || 'Campaign sent successfully',
    };
  } catch (error: any) {
    // Detect CORS or network errors
    let errorMessage = error.message || 'Failed to send campaign data';

    if (error.name === 'AbortError') {
      errorMessage = 'Webhook request timed out after 10 seconds';
    } else if (error.message === 'Failed to fetch') {
      errorMessage = 'Network error: Unable to reach webhook. This may be a CORS issue - check n8n CORS settings or use a backend proxy.';
      console.error('[CORS ERROR] The webhook request was blocked. This usually means:');
      console.error('1. n8n is not configured to accept requests from this origin (localhost:5173)');
      console.error('2. Network connectivity issue');
      console.error('3. n8n server is down');
    }

    if (error instanceof WebhookValidationError) {
      console.error('[sendCampaignToWebhook] Validation error:', error.message);
    } else {
      console.error('Error sending campaign to webhook:', error);
      console.error('Full error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }

    logWebhookCall('POST', 'Add-Campain', payload?.user_id || 'MISSING', false, { error: errorMessage });
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get top profitable campaigns
 * REQUIRED: userId must be provided for user-level data isolation
 */
export async function getTopProfitableCampaigns(userId: string, limit: number = 5): Promise<CampaignData[]> {
  try {
    const validatedUserId = validateUserId(userId);
    const campaigns = await fetchCampaignsData(validatedUserId);

    // Calculate profit for each campaign
    const campaignsWithProfit = campaigns.map(campaign => ({
      ...campaign,
      profit: (campaign.revenue || 0) - (campaign.spend || 0),
    }));

    // Sort by profit descending
    const sorted = campaignsWithProfit.sort((a, b) => (b.profit || 0) - (a.profit || 0));

    // Return top N
    return sorted.slice(0, limit);
  } catch (error) {
    if (error instanceof WebhookValidationError) {
      console.error('[getTopProfitableCampaigns] Validation error:', error.message);
    } else {
      console.error('Error getting top profitable campaigns:', error);
    }
    return [];
  }
}
