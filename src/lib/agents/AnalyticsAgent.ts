import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';

import { fetchDashboardData } from '../dashboardDataService';

export type TimeRange = '7d' | '30d' | '90d' | 'custom' | 'all';

export interface AreaChartData {
    month: string;
    views: number;
    conversions: number;
    buy: number;
}

export interface ViewerBehaviorData {
    revenue: number;
    metrics: {
        month: string;
        ctr: number;
        reactions: number;
        interaction_rate: number;
    }[];
}

export interface AnalyticsPayload {
    chartData: AreaChartData[];
    viewerBehavior: ViewerBehaviorData;
}

export function useAnalyticsAgent(timeRange: TimeRange = 'all') {
    return useQuery({
        queryKey: ['dashboard_data_master'],
        queryFn: async () => {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user) throw new Error("Unauthorized");
            return await fetchDashboardData(session.session.user.id);
        },
        select: (dashData): AnalyticsPayload => {
            // Map actual sales trend from Meta API
            const chartData: AreaChartData[] = (dashData.sales_trend || []).map(t => ({
                month: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                views: t.budget || (t.spend || 0) * 10,  // fallback proxies if views missing
                conversions: t.clicks || 0,
                buy: t.sales || 0
            }));

            // If empty, provide some default shape so the chart doesn't break
            if (chartData.length === 0) {
                chartData.push({ month: 'No Data', views: 0, conversions: 0, buy: 0 });
            }

            const viewerBehavior: ViewerBehaviorData = {
                revenue: parseFloat(String(dashData.insights?.total_spend || dashData.insights?.total_sales || 0)),
                metrics: dashData.insights?.weekly_trend?.map(w => ({
                    month: w.day,
                    ctr: w.value,
                    reactions: w.value * 0.8,
                    interaction_rate: w.value * 1.2
                })) || [
                        { month: 'N/A', ctr: 0, reactions: 0, interaction_rate: 0 }
                    ]
            };

            return { chartData, viewerBehavior };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
