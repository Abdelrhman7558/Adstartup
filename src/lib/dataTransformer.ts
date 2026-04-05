export interface Campaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  revenue: number;
  roas: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
  cpa?: number;
  frequency?: number;
  cpm?: number;
  landing_page_views?: number;
  cost_per_lpv?: number;
  content_view_cost?: number;
  content_view_value?: number;
  add_to_cart_cost?: number;
  add_to_cart_value?: number;
  checkout_cost?: number;
  checkout_value?: number;
  date_start?: string;
  date_stop?: string;
  account_name?: string;
  ad_account_id?: string;
}

export interface SalesTrend {
  date: string;
  sales: number;
  spend?: number;
  clicks?: number;
  budget?: number;
}

export interface RecentCampaign {
  id: string;
  name: string;
  status: string;
  revenue?: number;
  spend?: number;
  roas?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
  cpa?: number;
  frequency?: number;
  cpm?: number;
  landing_page_views?: number;
  cost_per_lpv?: number;
  content_view_cost?: number;
  content_view_value?: number;
  add_to_cart_cost?: number;
  add_to_cart_value?: number;
  checkout_cost?: number;
  checkout_value?: number;
  date_start?: string;
  date_stop?: string;
  created_at?: string;
  thumbnail?: string;
  account_name?: string;
  ad_account_id?: string;
}

export interface Ad {
  [x: string]: any;
  id: string;
  name: string;
  status: string;
  image_url?: string;
  impressions: number;
  clicks: number;
  spend: number;
  ctr?: number;
  cpc?: number;
}

export interface InsightsData {
  summary_cards: Array<{
    label: string;
    value: string;
    trend: string;
    trend_direction: 'up' | 'down';
  }>;
  activity_grid: Array<{
    date: string;
    count: number;
  }>;
  campaign_performance: Array<{
    id: string;
    name: string;
    progress: number;
    metric: string;
    value: string;
    color: string;
  }>;
  weekly_trend: Array<{
    day: string;
    value: number;
  }>;
  // Legacy support optional
  total_sales?: string | number;
  total_spend?: string | number;
  roas?: string | number;
  conversion_rate?: string | number;
}

export interface DashboardData {
  recent_campaigns: RecentCampaign[];
  sales_trend: SalesTrend[];
  top_5_campaigns: Campaign[];
  ads: Ad[];
  insights?: InsightsData;
}

export const DEFAULT_DASHBOARD_DATA: DashboardData = {
  top_5_campaigns: [],
  recent_campaigns: [],
  ads: [],
  sales_trend: [],
  insights: {
    summary_cards: [],
    activity_grid: [],
    campaign_performance: [],
    weekly_trend: []
  },
};

// Helper function to safely parse numbers
const safeNumber = (val: any) => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

export function transformDashboardData(data: any): DashboardData {
  if (!data) return DEFAULT_DASHBOARD_DATA;

  const normalizeCampaign = (c: any): RecentCampaign => ({
    id: c.campaign_id || c.id || '',
    name: c.campaign_name || c.name || 'Unnamed Campaign',
    status: c.status || 'unknown',
    revenue: safeNumber(c.revenue || c.total_revenue),
    spend: safeNumber(c.spend || c.total_spend),
    roas: safeNumber(c.roas),
    impressions: safeNumber(c.impressions),
    clicks: safeNumber(c.clicks),
    ctr: safeNumber(c.ctr),
    cpc: safeNumber(c.cpc),
    cpa: safeNumber(c.cpa),
    frequency: safeNumber(c.frequency),
    cpm: safeNumber(c.cpm),
    landing_page_views: safeNumber(c.landing_page_views),
    cost_per_lpv: safeNumber(c.cost_per_lpv),
    content_view_cost: safeNumber(c.content_view_cost),
    content_view_value: safeNumber(c.content_view_value),
    add_to_cart_cost: safeNumber(c.add_to_cart_cost),
    add_to_cart_value: safeNumber(c.add_to_cart_value),
    checkout_cost: safeNumber(c.checkout_cost),
    checkout_value: safeNumber(c.checkout_value),
    date_start: c.start_time || c.start_date || c.date_start || null,
    date_stop: c.end_time || c.end_date || c.stop_time || c.date_stop || null,
    created_at: c.created_at || new Date().toISOString(),
    thumbnail: c.thumbnail,
    account_name: c.account_name,
    ad_account_id: c.ad_account_id
  });

  return {
    top_5_campaigns: Array.isArray(data.top_5_campaigns) ? data.top_5_campaigns.map((c: any) => ({
      id: c.campaign_id || c.id || '',
      name: c.campaign_name || c.name || 'Unnamed Campaign',
      status: c.status || 'unknown',
      spend: Number(c.spend || 0),
      revenue: Number(c.revenue || 0),
      roas: Number(c.roas || 0),
      impressions: Number(c.impressions || 0),
      clicks: Number(c.clicks || 0),
      ctr: Number(c.ctr || 0),
      cpc: Number(c.cpc || 0),
      cpa: Number(c.cpa || 0),
      frequency: Number(c.frequency || 0),
      cpm: Number(c.cpm || 0),
      landing_page_views: Number(c.landing_page_views || 0),
      cost_per_lpv: Number(c.cost_per_lpv || 0),
      content_view_cost: Number(c.content_view_cost || 0),
      content_view_value: Number(c.content_view_value || 0),
      add_to_cart_cost: Number(c.add_to_cart_cost || 0),
      add_to_cart_value: Number(c.add_to_cart_value || 0),
      checkout_cost: Number(c.checkout_cost || 0),
      checkout_value: Number(c.checkout_value || 0),
      date_start: c.date_start || c.start_time || null,
      date_stop: c.date_stop || c.end_time || null,
      account_name: c.account_name,
      ad_account_id: c.ad_account_id
    }))
      .filter((c: Campaign) => c.name && c.name !== 'Unnamed Campaign' && c.id)
      : [],
    sales_trend: Array.isArray(data.sales_trend) ? data.sales_trend.map((t: any) => ({
      date: t.date,
      sales: Number(t.sales || t.revenue || 0),
      spend: Number(t.spend || 0),
      clicks: Number(t.clicks || 0),
      budget: Number(t.budget || t.daily_budget || 0)
    })) : [],
    recent_campaigns: Array.isArray(data.recent_campaigns)
      ? data.recent_campaigns
        .map(normalizeCampaign)
        .filter((c: RecentCampaign) => c.name && c.name !== 'Unnamed Campaign' && c.id)
      : [],
    ads: Array.isArray(data.ads) ? data.ads : [],
    insights: data.insights || DEFAULT_DASHBOARD_DATA.insights,
  };
}
