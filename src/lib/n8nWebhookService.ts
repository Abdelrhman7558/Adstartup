import type { DashboardData } from './dataTransformer';
import { DEFAULT_DASHBOARD_DATA, transformDashboardData } from './dataTransformer';
import { supabase } from './supabase';

const MAIN_DATA_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook/other-data';
const SALES_TREND_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook/sales-trend';

// Replaced by get-meta-campaigns
// const RECENT_CAMPAIGNS_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook/Recently-campaign';
// const ALL_ADS_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook/all-ads';
// const ACTIVE_CAMPAIGNS_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook/active-campaigns';
// const TOP_5_CAMPAIGNS_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook/top-5-campaigns';

// Replaced by get-meta-insights
// const INSIGHTS_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook/Insights';

export async function fetchActiveCampaigns(userId: string): Promise<any[]> {
  if (!userId) return [];

  try {
    const { data: json, error } = await supabase.functions.invoke('get-meta-campaigns', {
      body: { userId }
    });

    if (error) throw error;

    console.log('[Dashboard] Active Campaigns received:', json);
    return json?.active_campaigns || [];
  } catch (err) {
    console.error('Error fetching active campaigns:', err);
    return [];
  }
}

export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  if (!userId) {
    console.error('[Dashboard] User ID is required');
    return DEFAULT_DASHBOARD_DATA;
  }

  try {
    console.log('[Dashboard] Starting parallel webhook requests...', { userId });

    const fetchSafeLegacy = async (url: string, label: string) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();
        console.log(`[Dashboard] ${label} received:`, json);
        return json;
      } catch (err) {
        console.log(`[Dashboard] ${label} skipped or timed out:`, err);
        return {};
      }
    };

    // Parallel execution for new Edge Functions and legacy webhooks
    const [
      mainData,
      trendData,
      { data: metaCampaigns, error: campaignsError },
      { data: metaInsights, error: insightsError }
    ] = await Promise.all([
      fetchSafeLegacy(MAIN_DATA_URL, 'Main Data'),
      fetchSafeLegacy(SALES_TREND_URL, 'Sales Trend'),
      supabase.functions.invoke('get-meta-campaigns', { body: { userId } }),
      supabase.functions.invoke('get-meta-insights', { body: { userId } })
    ]);

    if (campaignsError) console.error('[Dashboard] get-meta-campaigns failed:', campaignsError);
    if (insightsError) console.error('[Dashboard] get-meta-insights failed:', insightsError);


    // Merge data:
    // ... (logic for recent and trend)

    // Recent Campaigns Extraction
    let rawRecent = metaCampaigns?.recent_campaigns || [];
    if (!Array.isArray(rawRecent)) rawRecent = [];

    // Sales Trend Extraction
    let rawTrend = metaInsights?.sales_trend || trendData?.sales_trend || trendData;
    if (!Array.isArray(rawTrend)) rawTrend = [];

    // Top 5 Extraction
    let rawTop5 = metaCampaigns?.top_5_campaigns || [];
    if (!Array.isArray(rawTop5)) rawTop5 = [];

    // Insights Extraction
    let rawInsights = metaInsights?.insights || metaInsights || {};

    const combinedData = {
      ...mainData,
      recent_campaigns: rawRecent.length > 0 ? rawRecent : mainData?.recent_campaigns,
      sales_trend: rawTrend.length > 0 ? rawTrend : mainData?.sales_trend,
      top_5_campaigns: rawTop5.length > 0 ? rawTop5 : mainData?.top_5_campaigns,
      insights: rawInsights,
    };

    const safeData = transformDashboardData(combinedData);
    console.log('[Dashboard] Data merged and transformed');
    return safeData;

  } catch (error) {
    console.error('[Dashboard] Critical error merging data:', error);
    return DEFAULT_DASHBOARD_DATA;
  }
}

export async function fetchDashboardDataOnLoad(userId: string): Promise<DashboardData> {
  return fetchDashboardData(userId);
}
