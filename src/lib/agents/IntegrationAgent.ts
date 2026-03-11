import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';

export interface MetaConnectionState {
    isConnected: boolean;
    adAccountId: string | null;
    adAccountName: string | null;
    pixelId: string | null;
    catalogName: string | null;
    pageName: string | null;
}

export function useIntegrationAgent() {
    return useQuery({
        queryKey: ['agent_integrations'],
        queryFn: async (): Promise<MetaConnectionState> => {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user) throw new Error("Unauthorized");

            const { data, error } = await supabase
                .from('meta_connections')
                .select('is_connected, ad_account_id, pixel_id')
                .eq('user_id', session.session.user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error("Error fetching meta_connections:", error);
            }

            if (!data) {
                return {
                    isConnected: false,
                    adAccountId: null,
                    adAccountName: null,
                    pixelId: null,
                    catalogName: null,
                    pageName: null,
                };
            }

            return {
                isConnected: !!data.is_connected,
                adAccountId: data.ad_account_id || null,
                adAccountName: null,
                pixelId: data.pixel_id || null,
                catalogName: null,
                pageName: null,
            };
        },
        staleTime: 0, // Always fetch fresh to reflect recent connections
    });
}
