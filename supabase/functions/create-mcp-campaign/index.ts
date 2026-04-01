import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const MCP_URL = 'https://mcp.pipeboard.co/meta-ads-mcp';
const MCP_TOKEN = 'pk_52920daad0014891bb23e4612ecefdc7'; // From user configuration

/**
 * Helper to call Pipeboard MCP tools via HTTP POST
 */
async function callMcpTool(toolName: string, args: Record<string, any>) {
    const url = `${MCP_URL}?token=${MCP_TOKEN}`;
    const payload = {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
            name: toolName,
            arguments: args
        }
    };

    console.log(`[MCP Proxy] Calling tool: ${toolName}`, JSON.stringify(args));

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP Error ${response.status}: ${text}`);
        }

        const result = await response.json();
        
        if (result.error) {
            throw new Error(`MCP JSON-RPC Error: ${JSON.stringify(result.error)}`);
        }

        // Parse result from MCP response format
        const contentStr = result.result?.content?.[0]?.text;
        if (!contentStr) {
            throw new Error(`MCP Tool ${toolName} returned empty content.`);
        }

        // Some return raw string, some return JSON string
        try {
            return JSON.parse(contentStr);
        } catch {
            return { result: contentStr };
        }
    } catch (e: any) {
        console.error(`[MCP Proxy] Exception in tool ${toolName}:`, e.message);
        throw e;
    }
}

Deno.serve(async (req: Request) => {
    // 1. CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // 2. Auth Check
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Auth header' }), { status: 401, headers: corsHeaders });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized user' }), { status: 401, headers: corsHeaders });
        }

        // 3. Parse Frontend Payload
        const payload = await req.json();
        const { 
            campaign_name, 
            objective, 
            daily_budget, 
            meta_connection,
            page_id,
            assets
        } = payload;

        if (!meta_connection || !meta_connection.ad_account_id) {
            throw new Error("Missing ad_account_id in meta_connection payload.");
        }

        const accountId = meta_connection.ad_account_id;
        const accessToken = meta_connection.access_token; // We pass this to MCP to authenticate the actual Meta Account

        console.log(`[MCP Orchestrator] Starting campaign creation for account ${accountId}`);

        // STEP 1: Create Campaign via MCP
        const mappedObjective = objective === 'sales' ? 'OUTCOME_SALES' : 'OUTCOME_TRAFFIC';
        
        const campaignRes = await callMcpTool('create_campaign', {
            account_id: accountId,
            name: campaign_name,
            objective: mappedObjective,
            status: 'PAUSED',
            special_ad_categories: ['NONE'],
            access_token: accessToken
        });
        
        const campaignId = campaignRes.id || campaignRes.campaign_id || campaignRes.result?.id;
        if (!campaignId) {
            throw new Error(`Failed to extract campaign ID from MCP response: ${JSON.stringify(campaignRes)}`);
        }
        console.log(`[MCP Orchestrator] Campaign Created: ${campaignId}`);

        // STEP 2: Create AdSet via MCP
        const adsetRes = await callMcpTool('create_adset', {
            account_id: accountId,
            campaign_id: campaignId,
            name: `${campaign_name} - AdSet`,
            daily_budget: daily_budget * 100, // Converts to cents/lowest denomination
            billing_event: 'IMPRESSIONS',
            optimization_goal: 'OFFSITE_CONVERSIONS',
            bid_amount: 0,
            status: 'PAUSED',
            access_token: accessToken
        });
        
        const adsetId = adsetRes.id || adsetRes.adset_id || adsetRes.result?.id;
        console.log(`[MCP Orchestrator] AdSet Created: ${adsetId}`);

        // STEP 3 & 4 (Future Iteration depending on Catalog vs Upload):
        // Here we would call 'create_ad_creative' and 'create_ad'. 
        // For now, testing the orchestration flow up to AdSet.
        
        return new Response(JSON.stringify({ 
            success: true, 
            message: "Campaign and AdSet created via AI MCP Orchestrator successfully!",
            data: {
                meta_campaign_id: campaignId,
                meta_adset_id: adsetId
            }
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error('[MCP Orchestrator] Error:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message || 'Internal Server Error' 
        }), { status: 500, headers: corsHeaders });
    }
});
