import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const META_API_VERSION = 'v18.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

// ─── Types ──────────────────────────────────────────────────────

interface MetaConnectionData {
    ad_account_id: string;
    pixel_id: string | null;
    catalog_id: string | null;
    catalog_name: string | null;
    page_id: string | null;
    page_name: string | null;
    access_token: string;
}

interface CampaignPayload {
    user_id: string;
    campaign_id: string; // Local DB campaign ID
    campaign_name: string;
    objective: string;
    goal: string;
    daily_budget: number;
    currency: string;
    start_time: string;
    end_time: string | null;
    description: string;
    offer: string | null;
    meta_connection: MetaConnectionData;
    brief: Record<string, any>;
    asset_type: 'catalog' | 'upload';
    assets: Array<{
        id: string;
        file_name: string;
        file_type: string;
        file_url: string;
        storage_path: string;
    }>;
    catalog_id: string | null;
    catalog_name: string | null;
    page_id: string | null;
    page_name: string | null;
    account_id: string | null;
    account_name: string | null;
    agent_mode: string;
    timestamp: string;
}

// ─── Helper: Call Meta Graph API ────────────────────────────────

async function metaApiPost(
    endpoint: string,
    accessToken: string,
    params: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const url = `${META_API_BASE}${endpoint}`;
        const body = new URLSearchParams();
        body.append('access_token', accessToken);

        for (const [key, value] of Object.entries(params)) {
            if (value !== null && value !== undefined) {
                body.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
            }
        }

        console.log(`[MetaAPI] POST ${endpoint}`, Object.keys(params));

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            const errorMsg = result.error?.message || result.error?.error_user_msg || `HTTP ${response.status}`;
            console.error(`[MetaAPI] Error on ${endpoint}:`, result.error || result);
            return { success: false, error: errorMsg };
        }

        console.log(`[MetaAPI] Success on ${endpoint}:`, result.id || result);
        return { success: true, data: result };
    } catch (err) {
        console.error(`[MetaAPI] Exception on ${endpoint}:`, err);
        return { success: false, error: err.message || 'Network error calling Meta API' };
    }
}

// ─── Map objective to Meta API values ───────────────────────────

function mapObjective(objective: string): string {
    const mapping: Record<string, string> = {
        'sales': 'OUTCOME_SALES',
        'leads': 'OUTCOME_LEADS',
        'traffic': 'OUTCOME_TRAFFIC',
        'awareness': 'OUTCOME_AWARENESS',
        'engagement': 'OUTCOME_ENGAGEMENT',
        'app_promotion': 'OUTCOME_APP_PROMOTION',
    };
    return mapping[objective.toLowerCase()] || 'OUTCOME_SALES';
}

function mapOptimizationGoal(goal: string, objective: string): string {
    const goalMapping: Record<string, string> = {
        'increase sales': 'OFFSITE_CONVERSIONS',
        'maximize conversions': 'OFFSITE_CONVERSIONS',
        'link clicks': 'LINK_CLICKS',
        'impressions': 'IMPRESSIONS',
        'reach': 'REACH',
        'landing page views': 'LANDING_PAGE_VIEWS',
        'leads': 'LEAD_GENERATION',
    };
    return goalMapping[goal.toLowerCase()] || 'OFFSITE_CONVERSIONS';
}

// ─── Build targeting from brief ─────────────────────────────────

function buildTargeting(brief: Record<string, any>): Record<string, any> {
    const targeting: Record<string, any> = {};

    // Geo targeting
    if (brief.target_locations || brief.operating_countries) {
        const locations = (brief.target_locations || brief.operating_countries || '').split(',').map((s: string) => s.trim().toLowerCase());

        // Map common country names to Meta country codes
        const countryMap: Record<string, string> = {
            'egypt': 'EG', 'saudi arabia': 'SA', 'uae': 'AE', 'united arab emirates': 'AE',
            'usa': 'US', 'united states': 'US', 'uk': 'GB', 'united kingdom': 'GB',
            'kuwait': 'KW', 'qatar': 'QA', 'bahrain': 'BH', 'oman': 'OM',
            'jordan': 'JO', 'iraq': 'IQ', 'lebanon': 'LB', 'morocco': 'MA',
            'tunisia': 'TN', 'algeria': 'DZ', 'libya': 'LY', 'sudan': 'SD',
            'germany': 'DE', 'france': 'FR', 'italy': 'IT', 'spain': 'ES',
            'canada': 'CA', 'australia': 'AU', 'india': 'IN', 'pakistan': 'PK',
            'turkey': 'TR', 'nigeria': 'NG', 'south africa': 'ZA', 'brazil': 'BR',
        };

        const countries = locations
            .map((loc: string) => countryMap[loc] || (loc.length === 2 ? loc.toUpperCase() : null))
            .filter(Boolean);

        if (countries.length > 0) {
            targeting.geo_locations = { countries };
        }
    }

    // Default to Egypt if no location specified
    if (!targeting.geo_locations) {
        targeting.geo_locations = { countries: ['EG'] };
    }

    // Age targeting
    if (brief.age_range) {
        const ageMatch = brief.age_range.match(/(\d+)\s*[-–]\s*(\d+)/);
        if (ageMatch) {
            targeting.age_min = parseInt(ageMatch[1]);
            targeting.age_max = parseInt(ageMatch[2]);
        }
    }
    if (!targeting.age_min) targeting.age_min = 18;
    if (!targeting.age_max) targeting.age_max = 65;

    // Gender targeting
    if (brief.gender) {
        const g = brief.gender.toLowerCase();
        if (g === 'male' || g === 'men') targeting.genders = [1];
        else if (g === 'female' || g === 'women') targeting.genders = [2];
        // else all genders (don't set genders field)
    }

    return targeting;
}

// ─── Convert budget to cents ────────────────────────────────────

function budgetToCents(amount: number): number {
    return Math.round(amount * 100);
}

// ─── Format datetime for Meta API ───────────────────────────────

function formatMetaDateTime(dt: string): string {
    // Meta expects ISO 8601 format
    try {
        return new Date(dt).toISOString();
    } catch {
        return dt;
    }
}

// ─── Main Handler ───────────────────────────────────────────────

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Auth check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing Authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid authorization token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const payload: CampaignPayload = await req.json();

        // Validate required fields
        const { meta_connection } = payload;
        if (!meta_connection?.ad_account_id) {
            return new Response(
                JSON.stringify({ error: 'Missing ad_account_id. Please connect your Meta account first.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }
        if (!meta_connection?.access_token) {
            return new Response(
                JSON.stringify({ error: 'Missing access token. Please reconnect your Meta account.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const accessToken = meta_connection.access_token;
        // Ensure ad account ID has the act_ prefix
        const adAccountId = meta_connection.ad_account_id.startsWith('act_')
            ? meta_connection.ad_account_id
            : `act_${meta_connection.ad_account_id}`;

        const pageId = payload.page_id || meta_connection.page_id;

        console.log('[CreateCampaign] Starting campaign creation:', {
            user_id: payload.user_id,
            campaign_name: payload.campaign_name,
            ad_account_id: adAccountId,
            asset_type: payload.asset_type,
            agent_mode: payload.agent_mode,
            has_page: !!pageId,
            has_brief: Object.keys(payload.brief || {}).length > 0,
        });

        const results: Record<string, any> = {
            meta_campaign_id: null,
            meta_adset_ids: [],
            meta_creative_id: null,
            meta_ad_ids: [],
        };

        const createdResources: { type: string; id: string }[] = [];

        async function cleanupResources() {
            console.log('[Cleanup] Deleting created resources in reverse order...');
            for (const res of [...createdResources].reverse()) {
                try {
                    await metaApiPost(`/${res.id}`, accessToken, { status: 'DELETED' });
                    console.log(`[Cleanup] Deleted ${res.type}: ${res.id}`);
                } catch (e: any) {
                    console.error(`[Cleanup] Failed to delete ${res.type}: ${res.id}`, e.message);
                }
            }
        }

        try {
            // ─── Step 1: Create Campaign ────────────────────────────────

            const campaignResult = await metaApiPost(`/${adAccountId}/campaigns`, accessToken, {
                name: payload.campaign_name,
                objective: mapObjective(payload.objective),
                status: 'PAUSED',
                special_ad_categories: [],
            });

            if (!campaignResult.success) {
                throw new Error(`Failed to create campaign: ${campaignResult.error}`);
            }

            results.meta_campaign_id = campaignResult.data.id;
            createdResources.push({ type: 'campaign', id: results.meta_campaign_id });
            console.log('[CreateCampaign] Campaign created:', results.meta_campaign_id);

            // ─── Step 2: Create Ad Creative ─────────────────────────────

            const creativeParams: Record<string, any> = {
                name: `${payload.campaign_name} - Creative`,
            };

            const websiteUrl = payload.brief?.website_url || 'https://example.com';

            if (payload.asset_type === 'upload' && payload.assets.length > 0) {
                const primaryAsset = payload.assets[0];
                const isVideo = primaryAsset.file_type?.startsWith('video');

                if (isVideo) {
                    creativeParams.object_story_spec = {
                        page_id: pageId,
                        video_data: {
                            video_url: primaryAsset.file_url,
                            title: payload.campaign_name,
                            message: payload.description || payload.campaign_name,
                            call_to_action: {
                                type: 'SHOP_NOW',
                                value: { link: websiteUrl },
                            },
                        },
                    };
                } else {
                    creativeParams.object_story_spec = {
                        page_id: pageId,
                        link_data: {
                            image_url: primaryAsset.file_url,
                            link: websiteUrl,
                            message: payload.description || payload.campaign_name,
                            name: payload.campaign_name,
                            call_to_action: { type: 'SHOP_NOW' },
                        },
                    };
                }

                if (payload.assets.length > 1 && !isVideo) {
                    const childAttachments = payload.assets.slice(0, 10).map((asset) => ({
                        link: websiteUrl,
                        image_url: asset.file_url,
                        name: asset.file_name.replace(/\.[^/.]+$/, ''),
                        call_to_action: { type: 'SHOP_NOW' },
                    }));

                    creativeParams.object_story_spec = {
                        page_id: pageId,
                        link_data: {
                            link: websiteUrl,
                            message: payload.description || payload.campaign_name,
                            child_attachments: childAttachments,
                        },
                    };
                }
            } else if (payload.asset_type === 'catalog' && payload.catalog_id) {
                creativeParams.product_set_id = payload.catalog_id;
                creativeParams.object_story_spec = {
                    page_id: pageId,
                    template_data: {
                        message: payload.description || 'Check out our products!',
                        link: websiteUrl,
                        call_to_action: { type: 'SHOP_NOW' },
                    },
                };
            }

            const creativeResult = await metaApiPost(`/${adAccountId}/adcreatives`, accessToken, creativeParams);

            if (!creativeResult.success) {
                throw new Error(`Failed to create ad creative: ${creativeResult.error}`);
            }

            results.meta_creative_id = creativeResult.data.id;
            createdResources.push({ type: 'creative', id: results.meta_creative_id });
            console.log('[CreateCampaign] Creative created:', results.meta_creative_id);

            // ─── Step 3: Create Ad Sets & Ads (T.O.S Logic) ──────────────

            const isTestMode = payload.agent_mode === 'TEST_MODE';
            const numVariations = isTestMode ? 3 : 1;

            console.log(`[CreateCampaign] Creating ${numVariations} ad set/ad variations...`);

            for (let i = 1; i <= numVariations; i++) {
                const variationSuffix = isTestMode ? `- Test ${i}` : '';

                // Create Ad Set
                const targeting = buildTargeting(payload.brief || {});
                const adSetParams: Record<string, any> = {
                    campaign_id: results.meta_campaign_id,
                    name: `${payload.campaign_name} - Ad Set ${variationSuffix}`.trim(),
                    billing_event: 'IMPRESSIONS',
                    optimization_goal: mapOptimizationGoal(payload.goal, payload.objective),
                    daily_budget: budgetToCents(payload.daily_budget),
                    start_time: formatMetaDateTime(payload.start_time),
                    targeting: targeting,
                    status: 'PAUSED',
                };

                if (payload.end_time) {
                    adSetParams.end_time = formatMetaDateTime(payload.end_time);
                }

                if (meta_connection.pixel_id) {
                    adSetParams.promoted_object = { pixel_id: meta_connection.pixel_id };
                }

                if (payload.asset_type === 'catalog' && payload.catalog_id) {
                    adSetParams.promoted_object = {
                        ...(adSetParams.promoted_object || {}),
                        product_catalog_id: payload.catalog_id,
                        product_set_id: payload.catalog_id,
                    };
                }

                const adSetResult = await metaApiPost(`/${adAccountId}/adsets`, accessToken, adSetParams);

                if (!adSetResult.success) {
                    throw new Error(`Failed to create ad set variation ${i}: ${adSetResult.error}`);
                }

                const adsetId = adSetResult.data.id;
                results.meta_adset_ids.push(adsetId);
                createdResources.push({ type: 'adset', id: adsetId });
                console.log(`[CreateCampaign] Ad Set ${i} created:`, adsetId);

                // Create Ad
                const adResult = await metaApiPost(`/${adAccountId}/ads`, accessToken, {
                    name: `${payload.campaign_name} - Ad ${variationSuffix}`.trim(),
                    adset_id: adsetId,
                    creative: { creative_id: results.meta_creative_id },
                    status: 'PAUSED',
                });

                if (!adResult.success) {
                    throw new Error(`Failed to create ad variation ${i}: ${adResult.error}`);
                }

                const adId = adResult.data.id;
                results.meta_ad_ids.push(adId);
                createdResources.push({ type: 'ad', id: adId });
                console.log(`[CreateCampaign] Ad ${i} created:`, adId);
            }

            // ─── Step 4: Update local DB with Meta IDs ──────────────────

            const { error: updateError } = await supabase
                .from('campaigns')
                .update({
                    meta_campaign_id: results.meta_campaign_id,
                    meta_adset_id: results.meta_adset_ids[0], // Store primary ID for simple reference
                    meta_creative_id: results.meta_creative_id,
                    meta_ad_id: results.meta_ad_ids[0], // Store primary ID for simple reference
                    status: 'paused',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', payload.campaign_id)
                .eq('user_id', payload.user_id);

            if (updateError) {
                console.warn('[CreateCampaign] Failed to update local DB (campaign still created on Meta):', updateError);
            }

            console.log('[CreateCampaign] ✅ Full campaign created successfully!', results);

            return new Response(
                JSON.stringify({
                    success: true,
                    message: `Campaign created successfully with ${numVariations} variations! Status: PAUSED`,
                    data: {
                        ...results,
                        meta_adset_id: results.meta_adset_ids[0], // Backwards compat
                        meta_ad_id: results.meta_ad_ids[0], // Backwards compat
                    },
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );

        } catch (error: any) {
            console.error('[CreateCampaign] Fatal error:', error.message);
            await cleanupResources();
            return new Response(
                JSON.stringify({ error: error.message || 'Internal server error' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

    } catch (error: any) {
        console.error('[CreateCampaign] Fatal outer error:', error.message);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
