import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CampaignRequest {
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

        const { userId } = await req.json() as CampaignRequest;
        if (!userId) {
            throw new Error("Missing userId");
        }

        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Get ALL Meta Connection Details for User (supports multiple ad accounts)
        const { data: connections, error: connError } = await supabase
            .from('meta_connections')
            .select('access_token, ad_account_id')
            .eq('user_id', userId);

        if (connError || !connections || connections.length === 0) {
            console.error("[get-meta-campaigns] User Meta connections missing:", connError?.message);
            return new Response(JSON.stringify({
                recent_campaigns: [],
                top_5_campaigns: [],
                active_campaigns: []
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Filter to only valid connections with both token and account ID
        const validConnections = connections.filter((c: any) => c.access_token && c.ad_account_id);
        if (validConnections.length === 0) {
            return new Response(JSON.stringify({
                recent_campaigns: [],
                top_5_campaigns: [],
                active_campaigns: []
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // 2. Fetch campaigns from ALL connected ad accounts in parallel
        const allCampaigns: any[] = [];

        const fetchPromises = validConnections.map(async (conn: any) => {
            try {
                const accessToken = conn.access_token;
                const adAccountId = conn.ad_account_id;

                // Fetch campaigns with insights and ad creative thumbnails
                const url = `https://graph.facebook.com/v19.0/${adAccountId}/campaigns?fields=id,name,status,objective,insights{impressions,clicks,spend,actions,action_values,purchase_roas},ads.limit(1){creative{thumbnail_url,object_story_spec{link_data{image_hash,picture},video_data{video_id}}}}&limit=1000&access_token=${accessToken}`;

                console.log(`[get-meta-campaigns] Fetching from Meta for account ${adAccountId}...`);
                const metaRes = await fetch(url);
                const metaData = await metaRes.json();

                if (!metaRes.ok) {
                    console.error(`[get-meta-campaigns] Meta API error for ${adAccountId}:`, metaData.error?.message);
                    return [];
                }

                return (metaData.data || []).map((campaign: any) => {
                    const insight = campaign.insights?.data?.[0] || {};

                    const spend = Number(insight.spend || 0);
                    const impressions = Number(insight.impressions || 0);
                    const clicks = Number(insight.clicks || 0);
                    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
                    const cpc = clicks > 0 ? spend / clicks : 0;

                    const revenue = Number(
                        insight.action_values?.find((a: any) => a.action_type === 'purchase')?.value || 0
                    );

                    const roas = insight.purchase_roas?.[0]?.value
                        ? Number(insight.purchase_roas[0].value)
                        : (spend > 0 ? revenue / spend : 0);

                    const purchases = Number(
                        insight.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0
                    );
                    const cpa = purchases > 0 ? spend / purchases : 0;

                    // Extract thumbnail from the first ad's creative
                    const firstAd = campaign.ads?.data?.[0];
                    const creative = firstAd?.creative;
                    const thumbnail = creative?.thumbnail_url
                        || creative?.object_story_spec?.link_data?.picture
                        || null;

                    return {
                        campaign_id: campaign.id,
                        campaign_name: campaign.name,
                        name: campaign.name,
                        id: campaign.id,
                        status: campaign.status?.toLowerCase() || null,
                        budget: spend,
                        spend: Number(spend.toFixed(2)),
                        revenue: Number(revenue.toFixed(2)),
                        roas: Number(roas.toFixed(2)),
                        impressions,
                        clicks,
                        ctr: Number(ctr.toFixed(2)),
                        cpc: Number(cpc.toFixed(2)),
                        cpa: Number(cpa.toFixed(2)),
                        date_start: insight.date_start || null,
                        date_stop: insight.date_stop || null,
                        start_date: insight.date_start || null,
                        end_date: insight.date_stop || null,
                        thumbnail: thumbnail,
                        ad_account_id: adAccountId
                    };
                });
            } catch (err) {
                console.error(`[get-meta-campaigns] Error fetching account ${conn.ad_account_id}:`, err);
                return [];
            }
        });

        const results = await Promise.all(fetchPromises);
        results.forEach((campaigns: any[]) => allCampaigns.push(...campaigns));

        // 4. Generate the 3 specific views needed by frontend

        // Recent / All Campaigns (just the same transformed list)
        const recent_campaigns = allCampaigns;

        // Active Campaigns
        const active_campaigns = allCampaigns.filter((c: any) => c.status === 'active');

        // Top 5 Campaigns (Sorted by Spend DESC)
        const top_5_campaigns = [...allCampaigns]
            .sort((a: any, b: any) => b.spend - a.spend)
            .slice(0, 5);

        // [Optional] Sync to our new local database tables (fire and forget to keep request fast)
        // We do this asynchronously so it doesn't block returning the HTTP response
        (async () => {
            try {
                const campaignInserts = allCampaigns.map((c: any) => ({
                    user_id: userId,
                    campaign_id: c.campaign_id,
                    name: c.campaign_name,
                    status: c.status,
                    spend: c.spend,
                    revenue: c.revenue,
                    roas: c.roas,
                    impressions: c.impressions,
                    clicks: c.clicks,
                    ctr: c.ctr,
                    cpc: c.cpc,
                    cpa: c.cpa,
                    start_date: c.start_date,
                    end_date: c.end_date,
                    last_fetched_at: new Date().toISOString()
                }));

                if (campaignInserts.length > 0) {
                    await supabase.from('meta_campaigns').upsert(campaignInserts, { onConflict: 'user_id,campaign_id' });
                }
            } catch (err) {
                console.error("[get-meta-campaigns] Sync warning:", err);
            }
        })();

        return new Response(JSON.stringify({
            all_campaigns: recent_campaigns,
            recent_campaigns,
            active_campaigns,
            top_5_campaigns
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("[get-meta-campaigns] Edge Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
