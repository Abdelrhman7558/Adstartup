import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { fetchDashboardData } from '../dashboardDataService';

export interface NormalizedCampaign {
    id: string;
    name: string;
    platform: 'facebook' | 'instagram' | 'multi';
    status: 'active' | 'draft' | 'paused' | 'error';
    thumbnail: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    created_at: string;
}

/**
 * Data Agent for Campaigns tab. 
 * Formats the raw Meta API data into a normalized schema for the UI.
 * Handles background caching and real-time refresh (polling).
 */
export function useCampaignsAgent() {
    return useQuery({
        queryKey: ['dashboard_data_master'],
        queryFn: async () => {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user) throw new Error("Unauthorized");
            return await fetchDashboardData(session.session.user.id);
        },
        select: (dashData): NormalizedCampaign[] => {
            const rawCampaigns = dashData.recent_campaigns || dashData.top_5_campaigns || [];

            return rawCampaigns.map(c => ({
                id: c.id,
                name: c.name,
                platform: 'facebook',
                status: mapMetaStatusToNormalized(c.status),
                thumbnail: c.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400&auto=format&fit=crop',
                spend: c.spend || 0,
                impressions: (c as any).impressions || 0,
                clicks: (c as any).clicks || 0,
                conversions: c.revenue || 0, // Using revenue/sales as conversions
                created_at: c.created_at || c.date_start || new Date().toISOString()
            }));
        },
        staleTime: 1000 * 60, // 1 minute
    });
}

// Helpers
function mapMetaStatusToNormalized(status: string): NormalizedCampaign['status'] {
    if (!status) return 'draft';
    const norm = status.toUpperCase();
    if (norm === 'ACTIVE') return 'active';
    if (norm === 'PAUSED') return 'paused';
    if (norm === 'IN_PROCESS' || norm === 'WITH_ISSUES') return 'draft';
    return 'draft';
}
