import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';

import { fetchDashboardData } from '../dashboardDataService';

export interface SummaryMetric {
    value: string;
    trendValue: number;
    trendPositive: boolean;
}

export interface OverviewMetricsPayload {
    views: SummaryMetric;
    visitors: SummaryMetric;
    clicks: SummaryMetric;
    orders: SummaryMetric;
}

export function useOverviewAgent() {
    return useQuery({
        queryKey: ['dashboard_data_master'],
        queryFn: async () => {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user) throw new Error("Unauthorized");
            return await fetchDashboardData(session.session.user.id);
        },
        select: (dashData): OverviewMetricsPayload => {
            const cards = dashData.insights?.summary_cards || [];

            const getMetric = (labelMatch: string, fallbackLabel: string, defVal: string) => {
                const card = cards.find(c => c.label.toLowerCase().includes(labelMatch)) ||
                    cards.find(c => c.label.toLowerCase().includes(fallbackLabel));
                return {
                    value: card ? String(card.value) : defVal,
                    trendValue: card ? parseFloat(card.trend) || 0 : 0,
                    trendPositive: card ? card.trend_direction === 'up' : true
                };
            };

            return {
                views: getMetric('reach', 'impressions', '0'),
                visitors: getMetric('impressions', 'views', '0'),
                clicks: getMetric('clicks', 'clicks', '0'),
                orders: getMetric('spend', 'sales', '$0'), // Using Spend or Sales for the Orders slot
            };
        },
        staleTime: 1000 * 60 * 2,
        refetchInterval: 1000 * 60 * 2, // 2 mins refresh
    });
}
