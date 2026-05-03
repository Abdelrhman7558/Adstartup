// Meta Marketing API v21.0 client.
// Single place that talks to Graph API. Every call is awaited and surfaces
// `error.error_user_msg` / `error.error_data.blame_field_specs` so callers can
// produce a real error message instead of "0 ads created, no reason given".

import { AdMetrics, AdsetMetrics, CampaignAggregate } from './types.ts';

const GRAPH_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export class MetaApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: number | undefined,
    public readonly subcode: number | undefined,
    public readonly fbtraceId: string | undefined,
    public readonly blameFieldSpecs: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'MetaApiError';
  }
}

async function graphFetch(
  path: string,
  accessToken: string,
  init: RequestInit & { params?: Record<string, string | number | boolean | undefined> } = {},
): Promise<any> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  url.searchParams.set('access_token', accessToken);
  if (init.params) {
    for (const [k, v] of Object.entries(init.params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method: init.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    body: init.body,
  });

  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }

  if (!res.ok || json?.error) {
    const e = json?.error ?? {};
    throw new MetaApiError(
      res.status,
      e.code,
      e.error_subcode,
      e.fbtrace_id,
      e.error_data?.blame_field_specs,
      e.error_user_msg || e.message || `Meta API error ${res.status}`,
    );
  }
  return json;
}

// ----- Insights ---------------------------------------------------------

export interface InsightsParams {
  adAccountId: string;            // act_123 form
  level: 'account' | 'campaign' | 'adset' | 'ad';
  datePreset?: 'last_3d' | 'last_7d' | 'last_14d' | 'last_28d' | 'last_30d';
  timeIncrement?: 1 | 7;
  attributionWindows?: ('1d_click' | '7d_click' | '1d_view')[];
  campaignIds?: string[];
  filtering?: Array<{ field: string; operator: string; value: string | number }>;
  fields?: string[];
}

const DEFAULT_INSIGHT_FIELDS = [
  'campaign_id', 'campaign_name',
  'adset_id', 'adset_name',
  'ad_id', 'ad_name',
  'impressions', 'clicks', 'spend', 'reach', 'frequency',
  'ctr', 'cpm', 'cpc',
  'actions', 'action_values',
  'cost_per_action_type',
  'purchase_roas',
  'unique_outbound_clicks_ctr',
  'date_start', 'date_stop',
];

export async function getInsights(
  accessToken: string,
  params: InsightsParams,
): Promise<any[]> {
  const allRows: any[] = [];
  let after: string | undefined;
  do {
    const json = await graphFetch(`/${params.adAccountId}/insights`, accessToken, {
      params: {
        level: params.level,
        date_preset: params.datePreset ?? 'last_7d',
        time_increment: params.timeIncrement,
        action_attribution_windows: JSON.stringify(params.attributionWindows ?? ['7d_click', '1d_view']),
        fields: (params.fields ?? DEFAULT_INSIGHT_FIELDS).join(','),
        filtering: params.filtering ? JSON.stringify(params.filtering) : undefined,
        limit: 200,
        after,
      },
    });
    if (Array.isArray(json.data)) allRows.push(...json.data);
    after = json.paging?.cursors?.after;
    if (!json.paging?.next) break;
  } while (after);
  return allRows;
}

// ----- Mutations --------------------------------------------------------

export async function pauseAd(accessToken: string, adId: string): Promise<any> {
  return graphFetch(`/${adId}`, accessToken, {
    method: 'POST',
    params: { status: 'PAUSED' },
  });
}

export async function pauseAdset(accessToken: string, adsetId: string): Promise<any> {
  return graphFetch(`/${adsetId}`, accessToken, {
    method: 'POST',
    params: { status: 'PAUSED' },
  });
}

export async function resumeAdset(accessToken: string, adsetId: string): Promise<any> {
  return graphFetch(`/${adsetId}`, accessToken, {
    method: 'POST',
    params: { status: 'ACTIVE' },
  });
}

export async function updateAdsetBudget(
  accessToken: string,
  adsetId: string,
  newDailyBudgetCents: number,
): Promise<any> {
  return graphFetch(`/${adsetId}`, accessToken, {
    method: 'POST',
    params: { daily_budget: newDailyBudgetCents },
  });
}

export async function updateCampaignBudget(
  accessToken: string,
  campaignId: string,
  newDailyBudgetCents: number,
): Promise<any> {
  return graphFetch(`/${campaignId}`, accessToken, {
    method: 'POST',
    params: { daily_budget: newDailyBudgetCents },
  });
}

export async function getAdset(accessToken: string, adsetId: string): Promise<any> {
  return graphFetch(`/${adsetId}`, accessToken, {
    params: { fields: 'id,name,status,daily_budget,lifetime_budget,campaign_id,billing_event,optimization_goal,targeting,is_dynamic_creative' },
  });
}

export async function duplicateAdset(
  accessToken: string,
  adsetId: string,
  campaignId: string,
): Promise<any> {
  return graphFetch(`/${adsetId}/copies`, accessToken, {
    method: 'POST',
    params: {
      deep_copy: true,
      status_option: 'PAUSED',
      campaign_id: campaignId,
    },
  });
}

// ----- Aggregation: Insights -> CampaignAggregate ----------------------

interface ActionEntry { action_type: string; value: string }

function pickAction(actions: ActionEntry[] | undefined, types: string[]): number {
  if (!actions) return 0;
  for (const t of types) {
    const m = actions.find(a => a.action_type === t);
    if (m) return parseFloat(m.value) || 0;
  }
  return 0;
}

export function aggregateAdsToMetrics(rows: any[], days: number): AdMetrics[] {
  return rows.map(r => {
    const purchases = pickAction(r.actions, ['omni_purchase', 'purchase']);
    const atc = pickAction(r.actions, ['omni_add_to_cart', 'add_to_cart']);
    const revenue = pickAction(r.action_values, ['omni_purchase', 'purchase']);
    const cpa = purchases > 0 ? parseFloat(r.spend ?? '0') / purchases : 0;
    const roas = parseFloat(r.purchase_roas?.[0]?.value ?? '0') || (revenue / Math.max(parseFloat(r.spend ?? '0'), 0.0001));
    return {
      ad_id: r.ad_id,
      adset_id: r.adset_id,
      campaign_id: r.campaign_id,
      ad_name: r.ad_name ?? '',
      campaign_name: r.campaign_name ?? '',
      spend: parseFloat(r.spend ?? '0'),
      revenue,
      roas,
      cpa,
      ctr: parseFloat(r.ctr ?? '0'),
      cpm: parseFloat(r.cpm ?? '0'),
      frequency: parseFloat(r.frequency ?? '1'),
      impressions: parseInt(r.impressions ?? '0', 10),
      clicks: parseInt(r.clicks ?? '0', 10),
      purchases,
      add_to_cart: atc,
      unique_outbound_clicks: r.unique_outbound_clicks_ctr ? parseFloat(r.unique_outbound_clicks_ctr) : undefined,
      reach: r.reach ? parseInt(r.reach, 10) : undefined,
      attribution_window: '7d',
      date_start: r.date_start,
      date_stop: r.date_stop,
      days_running: days,
    };
  });
}

export function aggregateAdsetsToMetrics(rows: any[]): AdsetMetrics[] {
  return rows.map(r => {
    const purchases = pickAction(r.actions, ['omni_purchase', 'purchase']);
    const revenue = pickAction(r.action_values, ['omni_purchase', 'purchase']);
    const cpa = purchases > 0 ? parseFloat(r.spend ?? '0') / purchases : 0;
    const roas = parseFloat(r.purchase_roas?.[0]?.value ?? '0') || (revenue / Math.max(parseFloat(r.spend ?? '0'), 0.0001));
    return {
      adset_id: r.adset_id,
      adset_name: r.adset_name ?? '',
      campaign_id: r.campaign_id,
      is_cbo: false,
      is_abo: true,
      spend: parseFloat(r.spend ?? '0'),
      revenue,
      roas,
      cpa,
      ctr: parseFloat(r.ctr ?? '0'),
      frequency: parseFloat(r.frequency ?? '1'),
      purchases,
    };
  });
}

export function rollupCampaign(
  ads7d: AdMetrics[], ads14d: AdMetrics[], ads3d: AdMetrics[],
  adsets: AdsetMetrics[],
  campaignId: string, campaignName: string,
): CampaignAggregate {
  const sum = (rows: AdMetrics[], key: keyof AdMetrics) =>
    rows.filter(r => r.campaign_id === campaignId)
        .reduce((s, r) => s + (typeof r[key] === 'number' ? (r[key] as number) : 0), 0);

  const spend_7d = sum(ads7d, 'spend');
  const revenue_7d = sum(ads7d, 'revenue');
  const purchases_7d = sum(ads7d, 'purchases');
  const spend_14d = sum(ads14d, 'spend');
  const revenue_14d = sum(ads14d, 'revenue');
  const spend_3d = sum(ads3d, 'spend');
  const revenue_3d = sum(ads3d, 'revenue');

  const adsCampaign7 = ads7d.filter(r => r.campaign_id === campaignId);
  const ctr_7d = adsCampaign7.length
    ? adsCampaign7.reduce((s, r) => s + r.ctr * r.impressions, 0) /
      Math.max(adsCampaign7.reduce((s, r) => s + r.impressions, 0), 1)
    : 0;

  return {
    campaign_id: campaignId,
    campaign_name: campaignName,
    spend_7d,
    revenue_7d,
    roas_7d: spend_7d > 0 ? revenue_7d / spend_7d : 0,
    cpa_7d: purchases_7d > 0 ? spend_7d / purchases_7d : 0,
    ctr_7d,
    purchases_7d,
    spend_14d,
    revenue_14d,
    roas_14d: spend_14d > 0 ? revenue_14d / spend_14d : 0,
    spend_3d,
    roas_3d: spend_3d > 0 ? revenue_3d / spend_3d : 0,
    ads: adsCampaign7,
    adsets: adsets.filter(a => a.campaign_id === campaignId),
    is_catalog: false,
  };
}
