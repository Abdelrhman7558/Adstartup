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

            const { data } = await supabase
                .from('meta_connections')
                .select('is_connected, ad_account_id, ad_account_name, pixel_id, catalog_name, page_name')
                .eq('user_id', session.session.user.id)
                .eq('is_connected', true)
                .maybeSingle();

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
                isConnected: data.is_connected,
                adAccountId: data.ad_account_id,
                adAccountName: data.ad_account_name, // Note: column might not exist depending on their DB map, fallback to generic
                pixelId: data.pixel_id,
                catalogName: data.catalog_name,
                pageName: data.page_name,
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
