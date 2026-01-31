import { supabase } from './supabase';

export interface MarketingCampaign {
  campaign_id: string;
  campaign_name: string;
  status: 'active' | 'paused' | 'completed';
  objective?: string;
  spend: number;
  revenue: number;
  roas: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversion: number;
  date_start?: string;
  date_stop?: string;
  top_country?: string;
  top_audience_segment?: string;
}

export interface MarketingAd {
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  status: 'active' | 'paused' | 'completed';
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversion: number;
  top_audience_segment?: string;
  creative_type?: string;
}

export interface SalesTrendData {
  date: string;
  sales: number;
  spend: number;
  roas: number;
  clicks?: number;
  impressions?: number;
}

export interface DashboardInsights {
  total_sales: number;
  total_spend: number;
  overall_roas: number;
  conversion_rate: number;
  average_ctr: number;
  best_performing_campaign?: string;
  worst_performing_campaign?: string;
  total_clicks: number;
  total_impressions: number;
  top_country?: string;
  top_audience_segment?: string;
}

export const marketingDashboardService = {
  async getCampaigns(userId: string): Promise<MarketingCampaign[]> {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAds(userId: string): Promise<MarketingAd[]> {
    const { data, error } = await supabase
      .from('marketing_ads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getSalesTrend(userId: string, days: number = 30): Promise<SalesTrendData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('marketing_sales_trend')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getInsights(userId: string): Promise<DashboardInsights> {
    const campaigns = await this.getCampaigns(userId);
    const ads = await this.getAds(userId);

    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversion, 0);
    const totalSales = (await this.getSalesTrend(userId)).reduce((sum, t) => sum + t.sales, 0);

    const overallRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const averageCtr = campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.ctr, 0) / campaigns.length : 0;

    let bestCampaign: MarketingCampaign | undefined;
    let worstCampaign: MarketingCampaign | undefined;

    if (campaigns.length > 0) {
      bestCampaign = campaigns.reduce((best, current) => (current.roas > best.roas ? current : best));
      worstCampaign = campaigns.reduce((worst, current) => (current.roas < worst.roas ? current : worst));
    }

    return {
      total_sales: totalSales,
      total_spend: totalSpend,
      overall_roas: overallRoas,
      conversion_rate: conversionRate,
      average_ctr: averageCtr,
      best_performing_campaign: bestCampaign?.campaign_name,
      worst_performing_campaign: worstCampaign?.campaign_name,
      total_clicks: totalClicks,
      total_impressions: totalImpressions,
    };
  },

  async getTopCampaigns(userId: string, limit: number = 5): Promise<MarketingCampaign[]> {
    const campaigns = await this.getCampaigns(userId);
    return campaigns.sort((a, b) => b.roas - a.roas).slice(0, limit);
  },

  async createCampaign(userId: string, campaign: Omit<MarketingCampaign, 'campaign_id'>): Promise<MarketingCampaign> {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .insert([{ user_id: userId, ...campaign }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createAd(userId: string, ad: Omit<MarketingAd, 'ad_id'>): Promise<MarketingAd> {
    const { data, error } = await supabase
      .from('marketing_ads')
      .insert([{ user_id: userId, ...ad }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addSalesTrendData(userId: string, trend: Omit<SalesTrendData, 'id'>): Promise<SalesTrendData> {
    const { data, error } = await supabase
      .from('marketing_sales_trend')
      .insert([{ user_id: userId, ...trend }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCampaign(userId: string, campaignId: string, updates: Partial<MarketingCampaign>): Promise<MarketingCampaign> {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .update(updates)
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCampaign(userId: string, campaignId: string): Promise<void> {
    const { error } = await supabase
      .from('marketing_campaigns')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};
