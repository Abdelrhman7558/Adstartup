import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const MCP_URL = 'https://mcp.pipeboard.co/meta-ads-mcp';
const MCP_TOKEN = 'pk_52920daad0014891bb23e4612ecefdc7';

async function callMcpTool(toolName: string, args: Record<string, any>) {
    const url = `${MCP_URL}?token=${MCP_TOKEN}`;
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
async function optimizeAdAccount(accountId: string, accessToken: string) {
    console.log(`[Optimizer] Running optimization for account: ${accountId}`);

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
        const spend = parseFloat(ad.spend || '0');
        const purchaseVal = parseFloat(ad.purchase_roas?.[0]?.value || '0');
        const cpa = parseFloat(ad.cost_per_action_type?.find((a: any) => a.action_type === 'omni_purchase')?.value || '0');
        const ctr = parseFloat(ad.ctr || '0');
        const frequency = parseFloat(ad.frequency || '1');
        const impressions = parseInt(ad.impressions || '0', 10);

        // Minimum spend guard
        if (spend < 5) continue;

        // RULE 1: Scaling (ROAS >= 6)
        if (purchaseVal >= 6) {
            actions.push(`Ad ${ad.ad_id}: ROAS is ${purchaseVal} (>= 6). Recommend HORIZONTAL SCALING (Winner Campaign).`);
            optimizedCount++;
            // Note: Implementation of actual duplication would call MCP 'duplicate_ad' here.
        }
        
        // RULE 2: Optimization (ROAS < 4)
        else if (purchaseVal > 0 && purchaseVal < 4) {
            actions.push(`Ad ${ad.ad_id}: ROAS is ${purchaseVal} (< 4). Recommend DECREASING BUDGET by 20%.`);
            optimizedCount++;
            // Note: Update budget via MCP.
        }

        // RULE 3: Bailout Protocol (High CPA, Low CTR)
        // Adjust threshold based on account average if known, static assumption for now:
        const targetCpa = 20; 
        if (cpa > (targetCpa * 2) && ctr < 0.7) {
            actions.push(`Ad ${ad.ad_id}: CPA ${cpa} > ${targetCpa*2} & CTR ${ctr} < 0.7%. PAUSING AD.`);
            
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

        // RULE 4: Promotion (Good CTR & CPA)
        if (ctr >= 1.5 && cpa > 0 && cpa <= targetCpa) {
            actions.push(`Ad ${ad.ad_id}: CTR ${ctr}% and CPA ${cpa}. Prime for Promotion to Winner Campaign.`);
            optimizedCount++;
        }

        // RULE 5: Ad Fatigue (Frequency > 2.5)
        if (frequency > 2.5) {
            actions.push(`Ad ${ad.ad_id}: Frequency ${frequency} > 2.5. Requires new creative iteration (Fatigue).`);
            optimizedCount++;
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
                const res = await optimizeAdAccount(conn.ad_account_id, conn.access_token);
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
