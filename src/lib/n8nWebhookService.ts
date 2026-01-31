import type { DashboardData } from './dataTransformer';
import { DEFAULT_DASHBOARD_DATA, transformDashboardData } from './dataTransformer';

const MAIN_DATA_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook/other-data';
const RECENT_CAMPAIGNS_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook/Recently-campaign';
const SALES_TREND_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook/sales-trend';
const ALL_ADS_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook/all-ads';
const ACTIVE_CAMPAIGNS_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook/active-campaigns';
const TOP_5_CAMPAIGNS_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook/top-5-campaigns';
const INSIGHTS_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook/Insights';

// ... other constants ...

export async function fetchActiveCampaigns(userId: string): Promise<any[]> {
  if (!userId) return [];

  try {
    const res = await fetch(ACTIVE_CAMPAIGNS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!res.ok) throw new Error('Failed to fetch active campaigns');

    const json = await res.json();
    console.log('[Dashboard] Active Campaigns received:', json);
    return json.active_campaigns || json || [];
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

    // Helper to fetch from a URL with error handling (returns empty object on failure)
    const fetchSafe = async (url: string, label: string) => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();
        console.log(`[Dashboard] ${label} received:`, json);
        return json;
      } catch (err) {
        console.error(`[Dashboard] ${label} failed:`, err);
        return {};
      }
    };

    // Parallel execution
    const [mainData, recentData, trendData, top5Data, insightsData] = await Promise.all([
      fetchSafe(MAIN_DATA_URL, 'Main Data'),
      fetchSafe(RECENT_CAMPAIGNS_URL, 'Recent Campaigns'),
      fetchSafe(SALES_TREND_URL, 'Sales Trend'),
      fetchSafe(TOP_5_CAMPAIGNS_URL, 'Top 5 Campaigns'),
      fetchSafe(INSIGHTS_URL, 'Insights'),
    ]);

    // Merge data:
    // ... (logic for recent and trend)

    // Recent Campaigns Extraction
    let rawRecent = recentData.recent_campaigns || recentData;
    if (!Array.isArray(rawRecent)) rawRecent = [];

    // Sales Trend Extraction
    let rawTrend = trendData.sales_trend || trendData;
    if (!Array.isArray(rawTrend)) rawTrend = [];

    // Top 5 Extraction
    let rawTop5 = top5Data.top_5_campaigns || top5Data;
    if (!Array.isArray(rawTop5)) rawTop5 = [];

    // Insights Extraction
    let rawInsights = insightsData.insights || insightsData || {};

    const combinedData = {
      ...mainData,
      recent_campaigns: rawRecent.length > 0 ? rawRecent : mainData.recent_campaigns,
      sales_trend: rawTrend.length > 0 ? rawTrend : mainData.sales_trend,
      top_5_campaigns: rawTop5.length > 0 ? rawTop5 : mainData.top_5_campaigns,
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
