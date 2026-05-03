import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const MCP_URL = Deno.env.get('PIPEBOARD_MCP_URL') ?? 'https://mcp.pipeboard.co/meta-ads-mcp';

function getMcpToken(): string {
    const token = Deno.env.get('PIPEBOARD_MCP_TOKEN');
    if (!token) {
        throw new Error('PIPEBOARD_MCP_TOKEN secret is not configured.');
    }
    return token;
}

async function callMcpTool(toolName: string, args: Record<string, any>) {
    const url = `${MCP_URL}?token=${getMcpToken()}`;
    const payload = {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name: toolName, arguments: args }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    const result = await response.json();
    if (result.error) throw new Error(`MCP Error: ${JSON.stringify(result.error)}`);

    const contentStr = result.result?.content?.[0]?.text;
    if (!contentStr) return null;

    try {
        return JSON.parse(contentStr);
    } catch {
        return { result: contentStr };
    }
}

/**
 * Applies the Optimization & Scaling Rules from the Implementation Plan
 */
async function optimizeAdAccount(accountId: string, accessToken: string, userId: string, supabase: any) {
    console.log(`[Optimizer] Running optimization for account: ${accountId}`);

    // Fetch Campaign Settings (Optimization Status & Enabled At)
    const { data: campaignSettings } = await supabase
        .from('meta_campaigns')
        .select('campaign_id, name, optimization_enabled, optimization_enabled_at')
        .eq('ad_account_id', accountId)
        .eq('user_id', userId);

    const settingsMap = new Map();
    (campaignSettings || []).forEach((s: any) => settingsMap.set(s.campaign_id, s));

    // Fetch Last 3 Days Insights (Ad Level)
    const insights = await callMcpTool('get_insights', {
        account_id: accountId,
        level: 'ad',
        date_preset: 'last_3d',
        access_token: accessToken
    });

    if (!insights || !Array.isArray(insights)) {
        console.log(`[Optimizer] No insights fetched for ${accountId} - ${JSON.stringify(insights)}`);
        return { accountId, optimized: 0, actions: [] };
    }

    const actions = [];
    let optimizedCount = 0;

    for (const ad of insights) {
        const campaignId = ad.campaign_id;
        const campaignName = ad.campaign_name || 'Unnamed Campaign';
        const setting = settingsMap.get(campaignId);
        
        // Skip if optimization not enabled for this campaign in DB
        if (!setting || !setting.optimization_enabled) continue;

        const enabledAt = setting.optimization_enabled_at ? new Date(setting.optimization_enabled_at) : null;
        const now = new Date();
        const daysSinceEnabled = enabledAt ? (now.getTime() - enabledAt.getTime()) / (1000 * 60 * 60 * 24) : 0;
        const isInTestingPhase = daysSinceEnabled < 3;

        const spend = parseFloat(ad.spend || '0');
        const purchaseVal = parseFloat(ad.purchase_roas?.[0]?.value || '0');
        const cpa = parseFloat(ad.cost_per_action_type?.find((a: any) => a.action_type === 'omni_purchase')?.value || '0');
        const ctr = parseFloat(ad.ctr || '0');
        const frequency = parseFloat(ad.frequency || '1');
        const impressions = parseInt(ad.impressions || '0', 10);

        // Minimum spend guard
        if (spend < 5) continue;

        let botPhase = isInTestingPhase ? 'testing' : 'optimizing';
        let actionTaken = 'skip';
        let actionDetail = null;
        let reason = null;

        // RULE 1: Scaling (ROAS >= 6) - Bypasses 3-day wait
        if (purchaseVal >= 6) {
            botPhase = 'scaling';
            actionTaken = 'scale';
            reason = `ROAS is ${purchaseVal} (>= 6).`;
            actionDetail = 'Recommend HORIZONTAL SCALING (Winner Campaign).';
            actions.push(`Ad ${ad.ad_id} [${campaignName}]: ${reason} ${actionDetail}`);
            optimizedCount++;
            // Note: Implementation of actual duplication would call MCP 'duplicate_ad' here.
        }
        
        // RULE 2: Optimization (ROAS < 4)
        else if (purchaseVal > 0 && purchaseVal < 4) {
            if (isInTestingPhase) {
                actionTaken = 'skip';
                reason = `ROAS is ${purchaseVal} (< 4), but in 3-day testing phase (${daysSinceEnabled.toFixed(1)} days).`;
                actions.push(`Ad ${ad.ad_id} [${campaignName}]: Skipping optimization. ${reason}`);
            } else {
                actionTaken = 'optimize';
                reason = `ROAS is ${purchaseVal} (< 4).`;
                actionDetail = 'Recommend DECREASING BUDGET by 20%.';
                actions.push(`Ad ${ad.ad_id} [${campaignName}]: ${reason} ${actionDetail}`);
                optimizedCount++;
            }
        }

        // RULE 3: Bailout Protocol (High CPA, Low CTR)
        // Adjust threshold based on account average if known, static assumption for now:
        const targetCpa = 20; 
        if (cpa > (targetCpa * 2) && ctr < 0.7) {
            if (isInTestingPhase) {
                actionTaken = 'skip';
                reason = `CPA ${cpa} > ${targetCpa*2} & CTR ${ctr} < 0.7%, but in 3-day testing phase.`;
                actions.push(`Ad ${ad.ad_id} [${campaignName}]: Skipping pause. ${reason}`);
            } else {
                actionTaken = 'pause';
                reason = `CPA ${cpa} > ${targetCpa*2} & CTR ${ctr} < 0.7%.`;
                actionDetail = 'PAUSING AD.';
                actions.push(`Ad ${ad.ad_id} [${campaignName}]: ${reason} ${actionDetail}`);
                
                // Execute Pause
                try {
                    await callMcpTool('update_ad', {
                        ad_id: ad.ad_id,
                        status: 'PAUSED',
                        access_token: accessToken
                    });
                    actions.push(`Ad ${ad.ad_id} paused successfully.`);
                } catch (e: any) {
                    actions.push(`Failed to pause Ad ${ad.ad_id}: ${e.message}`);
                }
                optimizedCount++;
            }
        }

        // RULE 4: Promotion (Good CTR & CPA)
        if (ctr >= 1.5 && cpa > 0 && cpa <= targetCpa) {
            actionTaken = 'optimize';
            reason = `CTR ${ctr}% and CPA ${cpa}.`;
            actionDetail = 'Prime for Promotion to Winner Campaign.';
            actions.push(`Ad ${ad.ad_id} [${campaignName}]: ${reason} ${actionDetail}`);
            optimizedCount++;
        }

        // RULE 5: Ad Fatigue (Frequency > 2.5)
        if (frequency > 2.5) {
            if (isInTestingPhase) {
                 // Skip fatigue check in testing? usually we let it run 3 days first.
            } else {
                actionTaken = 'fatigue';
                reason = `Frequency ${frequency} > 2.5.`;
                actionDetail = 'Requires new creative iteration (Fatigue).';
                actions.push(`Ad ${ad.ad_id} [${campaignName}]: ${reason} ${actionDetail}`);
                optimizedCount++;
            }
        }

        // Log to DB
        if (actionTaken !== 'skip' || isInTestingPhase) {
            await supabase.from('optimization_logs').insert({
                user_id: userId,
                campaign_id: campaignId,
                campaign_name: campaignName,
                action_type: actionTaken,
                action_detail: actionDetail,
                reason: reason,
                status: 'success',
                bot_phase: botPhase
            });
        }
    }

    return { accountId, optimized: optimizedCount, actions };
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const authHeader = req.headers.get('Authorization');
        // Simple CRON key check or User token check.
        // Assuming user token for manual trigger from dashboard for now.
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Auth header' }), { status: 401, headers: corsHeaders });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        
        // Allowed manual trigger or Service Role cron
        if (!user && token !== Deno.env.get('CRON_SECRET')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }

        // Fetch meta connection for the user (or all users if triggered via CRON)
        let query = supabase.from('meta_connections').select('ad_account_id, access_token').eq('is_connected', true);
        if (user) {
            query = query.eq('user_id', user.id);
        }

        const { data: connections, error } = await query;
        if (error) throw error;

        const results = [];
        for (const conn of (connections || [])) {
            if (!conn.ad_account_id || !conn.access_token) continue;
            try {
                const res = await optimizeAdAccount(conn.ad_account_id, conn.access_token, user?.id || (conn as any).user_id, supabase);
                results.push(res);
            } catch (e: any) {
                results.push({ accountId: conn.ad_account_id, error: e.message });
            }
        }

        return new Response(JSON.stringify({ success: true, results }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[Optimizer] Error:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
});
