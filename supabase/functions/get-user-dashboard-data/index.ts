import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DashboardData {
  top_5_campaigns: Array<{
    id: string;
    name: string;
    revenue: number;
    spend: number;
    roas: number;
    status: string;
  }>;
  total_sales: number;
  total_campaigns: number;
  active_ads: number;
  total_spend: number;
  total_revenue: number;
  recent_campaigns: Array<{
    id: string;
    name: string;
    status: string;
    created_at: string;
    budget: number;
  }>;
  ads: Array<{
    id: string;
    name: string;
    status: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
  }>;
  insights: {
    click_through_rate: number;
    conversion_rate: number;
    avg_cost_per_click: number;
    avg_roas: number;
  };
}

function replaceNullsWithDash<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return "-" as any;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => replaceNullsWithDash(item)) as any;
  }

  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = replaceNullsWithDash((obj as any)[key]);
    }
    return newObj;
  }

  return obj;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token or user not found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    const [
      campaignsResult,
      adsResult,
      campaignPerformanceResult
    ] = await Promise.all([
      supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),

      supabase
        .from("ads")
        .eq("user_id", userId)
        .select("*"),

      supabase
        .from("campaign_performance")
        .select("*")
        .eq("user_id", userId)
    ]);

    const campaigns = campaignsResult.data || [];
    const ads = adsResult.data || [];
    const performance = campaignPerformanceResult.data || [];

    const totalSpend = performance.reduce((sum, p) => sum + (p.spend || 0), 0);
    const totalRevenue = performance.reduce((sum, p) => sum + (p.revenue || 0), 0);
    const totalImpressions = performance.reduce((sum, p) => sum + (p.impressions || 0), 0);
    const totalClicks = performance.reduce((sum, p) => sum + (p.clicks || 0), 0);
    const totalConversions = performance.reduce((sum, p) => sum + (p.conversions || 0), 0);

    const campaignsWithMetrics = campaigns.map(campaign => {
      const perf = performance.find(p => p.campaign_id === campaign.id);
      const revenue = perf?.revenue || 0;
      const spend = perf?.spend || 0;
      const roas = spend > 0 ? revenue / spend : 0;

      return {
        id: campaign.id,
        name: campaign.name,
        revenue,
        spend,
        roas,
        status: campaign.status,
        created_at: campaign.created_at,
        budget: campaign.budget
      };
    });

    const top5Campaigns = campaignsWithMetrics
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        name: c.name,
        revenue: c.revenue,
        spend: c.spend,
        roas: c.roas,
        status: c.status
      }));

    const recentCampaigns = campaignsWithMetrics
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        created_at: c.created_at,
        budget: c.budget
      }));

    const activeAdsCount = ads.filter(ad => ad.status === "ACTIVE").length;

    const adsData = ads.map(ad => ({
      id: ad.id,
      name: ad.name,
      status: ad.status,
      impressions: ad.impressions || 0,
      clicks: ad.clicks || 0,
      spend: ad.spend || 0,
      conversions: ad.conversions || 0
    }));

    const clickThroughRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const avgCostPerClick = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    const dashboardData: DashboardData = {
      top_5_campaigns: top5Campaigns,
      total_sales: totalRevenue,
      total_campaigns: campaigns.length,
      active_ads: activeAdsCount,
      total_spend: totalSpend,
      total_revenue: totalRevenue,
      recent_campaigns: recentCampaigns,
      ads: adsData,
      insights: {
        click_through_rate: clickThroughRate,
        conversion_rate: conversionRate,
        avg_cost_per_click: avgCostPerClick,
        avg_roas: avgRoas
      }
    };

    const cleanedData = replaceNullsWithDash(dashboardData);

    return new Response(
      JSON.stringify(cleanedData),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});