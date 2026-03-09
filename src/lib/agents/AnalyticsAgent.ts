import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';

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
        queryKey: ['agent_analytics', timeRange],
        queryFn: async (): Promise<AnalyticsPayload> => {
            // 1. Session check to prevent unauth access
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user) {
                throw new Error("Unauthorized");
            }

            // Simulate network request
            await new Promise(resolve => setTimeout(resolve, 800));

            // Mocked identical data to reference image mapping
            const chartData: AreaChartData[] = [
                { month: 'July', views: 35000, conversions: 40000, buy: 65000 },
                { month: 'August', views: 38000, conversions: 43000, buy: 68000 },
                { month: 'September', views: 42000, conversions: 46000, buy: 72000 },
                { month: 'October', views: 56000, conversions: 68900, buy: 80000 },
                { month: 'November', views: 50000, conversions: 62000, buy: 78000 },
                { month: 'December', views: 48000, conversions: 58000, buy: 74000 },
            ];

            const viewerBehavior: ViewerBehaviorData = {
                revenue: 8320,
                metrics: [
                    { month: 'Jan', ctr: 40, reactions: 30, interaction_rate: 60 },
                    { month: 'Feb', ctr: 45, reactions: 35, interaction_rate: 65 },
                    { month: 'Mar', ctr: 55, reactions: 45, interaction_rate: 75 },
                    { month: 'Apr', ctr: 95, reactions: 65, interaction_rate: 85 }, // Highlighted in image
                    { month: 'May', ctr: 50, reactions: 40, interaction_rate: 60 },
                    { month: 'Jun', ctr: 45, reactions: 50, interaction_rate: 70 },
                    { month: 'Jul', ctr: 48, reactions: 45, interaction_rate: 65 },
                ]
            };

            return { chartData, viewerBehavior };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
