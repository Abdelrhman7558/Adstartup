// AI Media Buyer — OpenRouter-powered (matches ad-ops-agent setup).
//
// Receives the rule book + brief + recent decisions + live campaign metrics
// and answers as a media buyer. Tool use lets the AI trigger the
// optimization-engine for execution — AI decides, the engine enforces rules.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = Deno.env.get('AI_MEDIA_BUYER_MODEL') ?? 'anthropic/claude-sonnet-4.5';

const SYSTEM_PROMPT = `You are AdStartup's elite Media Buyer AI. You optimize Meta Ads campaigns using a strict IF/THEN rule framework supplied at runtime.

Operating principles, in order of priority:
1. Follow the supplied rule book exactly. If a rule applies, recommend its action.
2. Never recommend an action that violates "FORBIDDEN ACTIONS" sections (A5, B8).
3. Only recommend SCALE actions when the A7 pre-scaling gate has cleared.
4. Always cite the rule_id you are applying (e.g., "A2.1", "B7.2").
5. Prefer 7-day attribution data for any pause/budget decision (rule C1.1).
6. If data is < 3 days old, output "INSUFFICIENT DATA" and stop (C1.3).
7. Speak Arabic naturally to the operator unless they switch language. Stay concise — operators read your output between client calls.

Tools:
- recommend_action: queue a single recommended action for operator approval.
- execute_optimization_run: trigger the engine to evaluate ALL rules and execute (or dry-run) actions.

If the user asks about anything unrelated to media buying or Meta Ads, refuse politely and redirect.`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'recommend_action',
      description: 'Record a single recommended action against one campaign/adset/ad. Will be queued as pending for the operator to approve.',
      parameters: {
        type: 'object',
        required: ['rule_id', 'action', 'campaign_id', 'reason'],
        properties: {
          rule_id: { type: 'string', description: 'Rule identifier from the rule book, e.g. A2.1' },
          action: {
            type: 'string',
            enum: [
              // Existing optimization / scale actions
              'pause_ad','pause_adset','pause_and_refresh_creative',
              'pause_campaign','resume_campaign','delete_campaign',
              'increase_budget','decrease_budget',
              'duplicate_to_winners','flag_clear_winner','duplicate_winning_format',
              'apply_min_spend_floor','reduce_min_spend',
              'flag_self_competition','flag_overlap','flag_creative_fatigue',
              'rollback_last_budget_change','rollback_budget_exit_scale',
              'block_scaling_enter_hold','block_scaling_stay_optimize','block_scaling_refresh_creative','block_scaling_stabilize',
              'enter_hold_mode','exit_scale_mode','pause_scaling_refresh_creative',
              'launch_new_creative_variants','add_to_winners_and_scale','expand_audience',
              'reject_action','block_action',
              'use_attribution_window','output_insufficient_data',
              // New: lifecycle creation
              'create_campaign',
            ],
          },
          campaign_id: { type: 'string' },
          adset_id: { type: 'string' },
          ad_id: { type: 'string' },
          params: { type: 'object', description: 'Action params, e.g. {"pct": 20}' },
          reason: { type: 'string', description: 'Concise justification quoting the metrics that triggered the rule.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_campaign',
      description: 'Propose a NEW campaign for the operator to approve. Stored as a pending agent_action. When approved, creates the actual campaign on Meta via create-meta-campaign and auto-enrolls it into the optimization cycle.',
      parameters: {
        type: 'object',
        required: ['campaign_name', 'objective', 'daily_budget', 'reason'],
        properties: {
          campaign_name: { type: 'string' },
          objective: { type: 'string', enum: ['OUTCOME_SALES','OUTCOME_LEADS','OUTCOME_TRAFFIC','OUTCOME_AWARENESS','OUTCOME_ENGAGEMENT','OUTCOME_APP_PROMOTION'] },
          goal: { type: 'string', description: 'Free text goal (e.g. "Generate first 100 purchases at <$25 CPA")' },
          daily_budget: { type: 'number', description: 'In account currency, e.g. 50 for $50/day' },
          currency: { type: 'string', description: 'ISO code, e.g. USD, EGP' },
          start_time: { type: 'string', description: 'ISO datetime, e.g. 2026-05-04T09:00:00Z' },
          end_time:   { type: 'string', description: 'Optional ISO datetime' },
          description:{ type: 'string', description: 'Ad copy / messaging' },
          offer:      { type: 'string', description: 'Optional discount or offer text' },
          asset_type: { type: 'string', enum: ['catalog','upload'] },
          asset_ids:  { type: 'array', items: { type: 'string' }, description: 'IDs from user_assets to reuse, OR empty for catalog campaigns.' },
          catalog_id: { type: 'string' },
          reason:     { type: 'string', description: 'Why this campaign now? Reference rules, the brief, or recent winner data.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'execute_optimization_run',
      description: 'Trigger the optimization-engine to evaluate ALL rules against the user\'s campaigns and execute (or dry-run) the resulting actions. Use when the operator says "run the bot" or "optimize my campaigns now".',
      parameters: {
        type: 'object',
        required: ['mode'],
        properties: {
          mode: { type: 'string', enum: ['DAILY_ROUTINE','OPTIMIZE_CYCLE','SCALE_CHECK','GUARDRAIL'] },
          dry_run: { type: 'boolean', description: 'Default true. Set false only on explicit operator approval.' },
          campaign_id: { type: 'string', description: 'If set, restrict the run to a single campaign.' },
        },
      },
    },
  },
];

interface RuleRow {
  rule_id: string; mode: string; section: string; title: string;
  condition: any; action: string; action_params: any; description: string | null;
}

function formatRuleBook(rules: RuleRow[]): string {
  const bySection = new Map<string, RuleRow[]>();
  for (const r of rules) {
    const k = `${r.mode} · ${r.section}`;
    bySection.set(k, [...(bySection.get(k) ?? []), r]);
  }
  const lines: string[] = ['# RULE BOOK (compiled from optimization_rules table)'];
  for (const [section, rs] of bySection) {
    lines.push(`\n## ${section}`);
    for (const r of rs) {
      lines.push(`- ${r.rule_id} — ${r.title}`);
      if (r.description) lines.push(`  ${r.description}`);
    }
  }
  return lines.join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'OPENROUTER_API_KEY not configured' }),
      { status: 503, headers: corsHeaders },
    );
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const userMessage: string = body.message ?? '';
    const targetCampaignId: string | null = body.campaign_id ?? null;

    // Pull rules, brief, recent actions in parallel.
    const [{ data: rules }, { data: briefRow }, { data: recent }, { data: campaigns }] = await Promise.all([
      supabase.from('optimization_rules').select('*').eq('enabled', true).order('priority'),
      supabase.from('briefs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('agent_actions').select('rule_id,action,reason,status,before_metrics,after_metrics,created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      targetCampaignId
        ? supabase.from('meta_campaigns').select('*').eq('user_id', user.id).eq('campaign_id', targetCampaignId)
        : supabase.from('meta_campaigns').select('*').eq('user_id', user.id).order('last_fetched_at', { ascending: false }).limit(10),
    ]);

    const rulesText  = formatRuleBook((rules ?? []) as RuleRow[]);
    const briefText  = briefRow ? `# BRIEF\n${JSON.stringify(briefRow, null, 2)}` : '# BRIEF\n(none filed)';
    const recentText = recent && recent.length
      ? `# RECENT DECISIONS (last 20, newest first)\n${JSON.stringify(recent, null, 2)}`
      : '# RECENT DECISIONS\n(none yet)';
    const liveText   = `# LIVE CAMPAIGNS (snapshot)\n${JSON.stringify(campaigns ?? [], null, 2)}`;

    const messages = [
      { role: 'system',  content: SYSTEM_PROMPT },
      { role: 'user',    content: rulesText },
      { role: 'user',    content: briefText },
      { role: 'user',    content: recentText },
      { role: 'user',    content: liveText },
      { role: 'user',    content: `# OPERATOR REQUEST\n${userMessage}` },
    ];

    const orRes = await fetch(OPENROUTER_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://adstartup.me',
        'X-Title': 'Adstartup AI Media Buyer',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        tools: TOOLS,
        tool_choice: 'auto',
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!orRes.ok) {
      const errText = await orRes.text();
      console.error('[ai-media-buyer] OpenRouter error', errText);
      return new Response(
        JSON.stringify({ error: 'AI agent failed', detail: errText }),
        { status: 502, headers: corsHeaders },
      );
    }

    const orData = await orRes.json();
    const choice = orData.choices?.[0]?.message ?? {};
    const reply: string = choice.content ?? '';
    const toolCalls: any[] = choice.tool_calls ?? [];

    const dispatched: any[] = [];
    for (const tc of toolCalls) {
      const name = tc.function?.name;
      let args: any = {};
      try { args = JSON.parse(tc.function?.arguments ?? '{}'); } catch { args = {}; }

      if (name === 'execute_optimization_run') {
        const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/optimization-engine`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            mode: args.mode,
            dry_run: args.dry_run ?? true,
            campaign_id: args.campaign_id,
            user_id: user.id,
          }),
        });
        const j = await r.json().catch(() => ({}));
        dispatched.push({ tool: 'execute_optimization_run', result: j });
      } else if (name === 'recommend_action') {
        const ins = await supabase.from('agent_actions').insert({
          user_id: user.id,
          campaign_id: args.campaign_id,
          adset_id: args.adset_id,
          ad_id: args.ad_id,
          rule_id: args.rule_id,
          action: args.action,
          action_params: args.params ?? {},
          reason: args.reason,
          dry_run: true,
          status: 'pending',
        }).select().maybeSingle();
        dispatched.push({ tool: 'recommend_action', result: ins.data });
      } else if (name === 'propose_campaign') {
        // Pull connection so we can record meta_connection in the params.
        // The `execute-pending-action` handler forwards these to create-meta-campaign.
        const { data: conn } = await supabase
          .from('meta_connections').select('*').eq('user_id', user.id).maybeSingle();
        const meta_connection = conn ? {
          ad_account_id: conn.ad_account_id,
          page_id: conn.page_id,
          pixel_id: conn.pixel_id,
          instagram_actor_id: conn.instagram_actor_id,
          catalog_id: conn.catalog_id,
        } : {};

        const params = {
          campaign_name: args.campaign_name,
          objective: args.objective,
          goal: args.goal ?? '',
          daily_budget: args.daily_budget,
          currency: args.currency ?? 'USD',
          start_time: args.start_time ?? new Date(Date.now() + 60_000).toISOString(),
          end_time: args.end_time ?? null,
          description: args.description ?? '',
          offer: args.offer ?? null,
          asset_type: args.asset_type ?? 'upload',
          asset_ids: args.asset_ids ?? [],
          catalog_id: args.catalog_id ?? null,
          meta_connection,
          agent_mode: 'ai_media_buyer',
        };

        const ins = await supabase.from('agent_actions').insert({
          user_id: user.id,
          campaign_id: 'PENDING_CREATE', // placeholder until campaign is actually created
          rule_id: 'AI.create',
          action: 'create_campaign',
          action_params: params,
          reason: args.reason,
          dry_run: true,
          status: 'pending',
        }).select().maybeSingle();
        dispatched.push({ tool: 'propose_campaign', result: ins.data });
      }
    }

    return new Response(
      JSON.stringify({
        reply,
        tools_used: toolCalls.map((t: any) => ({ name: t.function?.name, args: t.function?.arguments })),
        dispatched,
        usage: orData.usage,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e: any) {
    console.error('[ai-media-buyer] fatal', e);
    return new Response(
      JSON.stringify({ error: e?.message ?? String(e) }),
      { status: 500, headers: corsHeaders },
    );
  }
});
