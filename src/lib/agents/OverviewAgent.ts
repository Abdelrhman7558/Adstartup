import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';

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
        queryKey: ['agent_overview_metrics'],
        queryFn: async (): Promise<OverviewMetricsPayload> => {
            // Security check
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user) throw new Error("Unauthorized");

            // Replace with real aggregation logic from our dashboardDataService or metaAdsService
            await new Promise(resolve => setTimeout(resolve, 600));

            return {
                views: { value: '43.433', trendValue: 15.5, trendPositive: true },
                visitors: { value: '12.120', trendValue: 12.8, trendPositive: true },
                clicks: { value: '8.120', trendValue: 4.16, trendPositive: false },
                orders: { value: '2.320', trendValue: 12.8, trendPositive: true },
            };
        },
        staleTime: 1000 * 60 * 2,
        refetchInterval: 1000 * 60 * 2, // 2 mins refresh
    });
}
