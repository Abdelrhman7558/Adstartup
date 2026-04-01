export interface CampaignData {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  spend: number;
  roi: number;
  conversions: number;
  cpc: number;
  lastUpdated: string;
}

export interface DashboardMetrics {
  totalSpend: number;
  totalRevenue: number;
  totalROI: number;
  activeCampaigns: number;
  campaigns: CampaignData[];
  lastSyncedAt: string;
}

const WEBHOOK_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook/95eb82c9-b790-4a95-89a0-273dca434073';

export async function fetchDashboardData(userId: string): Promise<DashboardMetrics> {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      totalSpend: data.totalSpend || 0,
      totalRevenue: data.totalRevenue || 0,
      totalROI: data.totalROI || 0,
      activeCampaigns: data.activeCampaigns || 0,
      campaigns: data.campaigns || [],
      lastSyncedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return {
      totalSpend: 0,
      totalRevenue: 0,
      totalROI: 0,
      activeCampaigns: 0,
      campaigns: [],
      lastSyncedAt: new Date().toISOString(),
    };
  }
}
