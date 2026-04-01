import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

import { PLAYBOOK } from './playbook.ts';

const SYSTEM_PROMPT = `You are the ultimate Adstartup Meta Ads Copilot. You are an elite, highly professional Media Buyer AI.

CRITICAL DIRECTIVE: You MUST ONLY answer questions related to advertising, marketing, Meta Ads, Pipeboard tools, and the user's specific campaigns. 
If the user asks you anything outside of this scope (e.g., "how to cook Mahshi", cooking recipes, programming help, politics, weather, general trivia), you MUST immediately refuse and politely redirect them by stating EXACTLY:
"أنا مساعدك الإعلاني المخصص فقط لإدارة وتحقيق أرباح من حملاتك الإعلانية. لا يمكنني الإجابة عن هذا السؤال العشوائي، يرجى سؤالي عن أداء حملاتك أو استراتيجيات إنشاء الحملات."

Your capabilities and logic are STRICTLY driven by the following Playbook:
--- START PLAYBOOK ---
${PLAYBOOK}
--- END PLAYBOOK ---

RULES FOR MEDIA BUYING:
1. NEVER advise the user to disable Advantage+ Creative or standard enhancements, as dynamic optimization is essential for scale.
2. Rely heavily on the Strategies outlined in the playbook (e.g., Small Farm, Assassin's Creed, P5, CBO Farm, etc.).
3. When formulating plans, use the vocabulary from the Playbook (e.g., Horizontal Scaling, Pump & Punish, etc.).

You must reply in Arabic natively, professional yet friendly, acting as the user's personal media buying partner.`;

Deno.serve(async (req: Request) => {
    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // 2. Validate Authentication
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

        // 3. Parse Request
        const { messages } = await req.json();
        
        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Messages array required' }), { status: 400, headers: corsHeaders });
        }

        // 4. Call OpenRouter API
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || "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";

        // Prepend System Prompt
        const conversation = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages
        ];

        console.log(`[AdOpsAgent] Sending request to OpenRouter for user: ${user.id}`);

        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'HTTP-Referer': 'https://adstartup.me',
                'X-Title': 'Adstartup',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o',
                messages: conversation,
                temperature: 0.3,
                max_tokens: 1500
            }),
        });

        if (!openRouterResponse.ok) {
            const errBody = await openRouterResponse.text();
            console.error('[AdOpsAgent] OpenRouter API Error:', errBody);
            return new Response(JSON.stringify({ error: 'Failed to communicate with AI agent.' }), { status: 502, headers: corsHeaders });
        }

        const aiData = await openRouterResponse.json();
        const assistantReply = aiData.choices[0].message;

        return new Response(JSON.stringify({ reply: assistantReply }), { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

    } catch (error: any) {
        console.error('[AdOpsAgent] Critical Exception:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { 
            status: 500, 
            headers: corsHeaders 
        });
    }
});
