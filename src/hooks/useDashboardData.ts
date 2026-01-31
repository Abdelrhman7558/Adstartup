import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface CampaignMetrics {
  id: string;
  name: string;
  revenue: number;
  spend: number;
  roas: number;
  status: string;
}

export interface RecentCampaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
  budget: number;
}

export interface AdData {
  id: string;
  name: string;
  status: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
}

export interface Insights {
  click_through_rate: number;
  conversion_rate: number;
  avg_cost_per_click: number;
  avg_roas: number;
}

export interface DashboardData {
  top_5_campaigns: CampaignMetrics[];
  total_sales: number;
  total_campaigns: number;
  active_ads: number;
  total_spend: number;
  total_revenue: number;
  recent_campaigns: RecentCampaign[];
  ads: AdData[];
  insights: Insights;
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardData(autoFetch: boolean = true): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('No active session. Please log in.');
        setLoading(false);
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-dashboard-data`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const dashboardData: DashboardData = await response.json();
      setData(dashboardData);
      setError(null);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchDashboardData();
    }
  }, [autoFetch, fetchDashboardData]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}
