import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InsightsRequest {
    userId: string;
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing authorization header");
        }

        const { userId } = await req.json() as InsightsRequest;
        if (!userId) {
            throw new Error("Missing userId");
        }

        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Get ALL Meta Connection Details for User
        const [connectionsResult, accountNamesResult] = await Promise.all([
            supabase
                .from('meta_connections')
                .select('access_token, ad_account_id')
                .eq('user_id', userId),
            supabase
                .from('manager_meta_accounts')
                .select('account_id, account_name')
                .eq('user_id', userId)
        ]);

        const connections = connectionsResult.data || [];
        const managerAccounts = accountNamesResult.data || [];

        if (connections.length === 0) {
            console.error("[get-meta-insights] User Meta connections missing");
            return new Response(JSON.stringify({
                insights: { summary_cards: [], activity_grid: [], campaign_performance: [], weekly_trend: [] }
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        const defaultToken = connections.find((c: any) => c.access_token)?.access_token;
        if (!defaultToken) {
            return new Response(JSON.stringify({
                insights: { summary_cards: [], activity_grid: [], campaign_performance: [], weekly_trend: [] }
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        const targetsMap = new Map<string, string>(); // adAccountId -> accessToken

        // 1. Add connection ad accounts
        connections.forEach((c: any) => {
            if (c.ad_account_id && c.access_token) {
                const normalized = c.ad_account_id.startsWith('act_') ? c.ad_account_id : `act_${c.ad_account_id}`;
                targetsMap.set(normalized, c.access_token);
            }
        });

        // 2. Add manager accounts
        managerAccounts.forEach((a: any) => {
            if (a.account_id) {
                const normalized = a.account_id.startsWith('act_') ? a.account_id : `act_${a.account_id}`;
                targetsMap.set(normalized, defaultToken);
            }
        });

        const targets = Array.from(targetsMap.entries()).map(([adAccountId, accessToken]) => ({ adAccountId, accessToken }));

        if (targets.length === 0) {
            return new Response(JSON.stringify({
                insights: { summary_cards: [], activity_grid: [], campaign_performance: [], weekly_trend: [] }
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // 2. Fetch insights from ALL targeted ad accounts in parallel
        const allInsightsData: any[] = [];

        const fetchPromises = targets.map(async (conn: any) => {
            try {
                const url = `https://graph.facebook.com/v21.0/${conn.adAccountId}/insights?fields=campaign_id,campaign_name,impressions,clicks,spend,ctr,cpc,reach,actions,action_values,purchase_roas,date_start&level=campaign&limit=200&date_preset=last_30d&access_token=${conn.accessToken}`;

                console.log(`[get-meta-insights] Fetching from Meta for account ${conn.adAccountId}...`);
                const metaRes = await fetch(url);
                const metaData = await metaRes.json();

                if (!metaRes.ok) {
                    console.error(`[get-meta-insights] Meta API error for ${conn.ad_account_id}:`, metaData.error?.message);
                    return [];
                }

                return metaData.data || [];
            } catch (err) {
                console.error(`[get-meta-insights] Error fetching account ${conn.ad_account_id}:`, err);
                return [];
            }
        });

        const results = await Promise.all(fetchPromises);
        results.forEach((items: any[]) => allInsightsData.push(...items));

        const data = allInsightsData;


        // 3. Transform Data EXACTLY like the n8n Insights Javascript Node did
        let totalRevenue = 0;
        let totalSpend = 0;
        let totalClicks = 0;
        let totalImpressions = 0;

        data.forEach((item: any) => {
            const spend = parseFloat(item.spend || 0);
            const clicks = parseInt(item.clicks || 0);
            const impressions = parseInt(item.impressions || 0);

            totalSpend += spend;
            totalClicks += clicks;
            totalImpressions += impressions;

            // Extract purchase action values from multiple possible action types
            if (item.action_values && Array.isArray(item.action_values)) {
                const purchaseValue = item.action_values.find((av: any) => 
                    av.action_type === 'purchase' || 
                    av.action_type === 'offsite_conversion.fb_pixel_purchase'
                );
                if (purchaseValue) {
                    totalRevenue += parseFloat(purchaseValue.value || 0);
                }
            }
        });

        const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend * 100) : 0;
        const conversionRate = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;

        // --- summary_cards ---
        const summary_cards = [
            { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, trend: "auto", trend_direction: "up" },
            { label: "Total Spend", value: `$${totalSpend.toFixed(2)}`, trend: "auto", trend_direction: "down" },
            { label: "ROI", value: `${roi.toFixed(2)}%`, trend: "auto", trend_direction: roi >= 0 ? "up" : "down" },
            { label: "Conversion Rate", value: `${conversionRate.toFixed(2)}%`, trend: "auto", trend_direction: "up" }
        ];

        // --- activity_grid ---
        const activity_grid = data.map((item: any) => ({
            date: item.date_start,
            count: parseInt(item.clicks || 0)
        }));

        // --- campaign_performance ---
        const campaignActionMap: any[] = [];
        data.forEach((item: any, index: number) => {
            const roasVal = item.purchase_roas && item.purchase_roas[0] ? item.purchase_roas[0].value : null;

            campaignActionMap.push({
                id: (index + 1).toString(),
                name: item.campaign_name || item.campaign?.name || `Campaign ${index + 1}`,
                progress: totalSpend > 0 ? Math.min(Math.round((parseFloat(item.spend || 0) / totalSpend) * 100), 100) : 0,
                metric: "ROAS",
                value: roasVal ? parseFloat(roasVal).toFixed(2) : "N/A",
                color: "#FF5733"
            });
        });
        // Sort logic from original or just map it directly
        const campaign_performance = campaignActionMap;

        // --- weekly_trend ---
        // Aggregate clicks by day of week from actual data
        const dayClickMap: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
        const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        activity_grid.forEach((item: any) => {
            if (item.date) {
                const d = new Date(item.date);
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                if (dayClickMap[dayName] !== undefined) {
                    dayClickMap[dayName] += item.count;
                }
            }
        });
        const weekly_trend = dayOrder.map(day => ({ day, value: dayClickMap[day] }));

        // Construct final matching payload
        return new Response(JSON.stringify({
            insights: {
                summary_cards,
                activity_grid,
                campaign_performance,
                weekly_trend
            }
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("[get-meta-insights] Edge Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
