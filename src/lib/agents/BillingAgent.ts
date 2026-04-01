import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';

export interface Invoice {
    id: string;
    amount: number;
    date: string;
    status: 'paid' | 'pending' | 'failed';
    description: string;
}

export interface BillingPayload {
    currentPlan: string;
    trialRemainingDays?: number;
    invoices: Invoice[];
}

export function useBillingAgent() {
    return useQuery({
        queryKey: ['agent_billing'],
        queryFn: async (): Promise<BillingPayload> => {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user) throw new Error("Unauthorized");

            const { data: userData } = await supabase
                .from('users')
                .select('trial_end_at, trial_expired, subscription_plan_id')
                .eq('id', session.session.user.id)
                .single();

            let trialDays = 0;
            if (userData?.trial_end_at && !userData?.trial_expired) {
                const diffTime = new Date(userData.trial_end_at).getTime() - new Date().getTime();
                trialDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }

            // Return mostly mock invoices for now
            return {
                currentPlan: userData?.subscription_plan_id || 'Free Trial',
                trialRemainingDays: trialDays,
                invoices: [
                    { id: 'inv_1234', amount: 149, date: new Date().toISOString(), status: 'paid', description: 'Pro Monthly Plan' },
                    { id: 'inv_1233', amount: 149, date: new Date(Date.now() - 30 * 86400000).toISOString(), status: 'paid', description: 'Pro Monthly Plan' }
                ]
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
