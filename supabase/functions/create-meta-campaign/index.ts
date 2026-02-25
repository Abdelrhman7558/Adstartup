import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const META_API_VERSION = 'v21.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

// ─── Types ──────────────────────────────────────────────────────

interface MetaConnectionData {
    ad_account_id: string;
    pixel_id: string | null;
    catalog_id: string | null;
    catalog_name: string | null;
    page_id: string | null;
    page_name: string | null;
    instagram_actor_id?: string | null;
    access_token: string | null;
}

interface CampaignPayload {
    user_id: string;
    campaign_id: string;
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
    selected_instagram_id?: string;
    account_id: string | null;
    account_name: string | null;
    agent_mode: string;
    timestamp: string;
}

// ─── Helper: Call Meta Graph API (form-urlencoded, standard format) ──────

async function metaApiPost(
    endpoint: string,
    accessToken: string,
    params: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const url = `${META_API_BASE}${endpoint}`;

        // Build form-urlencoded body (Meta API standard)
        // Nested objects/arrays must be JSON-stringified
        const formParams = new URLSearchParams();
        formParams.append('access_token', accessToken);
        for (const [key, value] of Object.entries(params)) {
            if (value === null || value === undefined) continue;
            if (typeof value === 'object') {
                formParams.append(key, JSON.stringify(value));
            } else {
                formParams.append(key, String(value));
            }
        }

        console.log(`[MetaAPI] POST ${url}`);
        console.log(`[MetaAPI] Params:`, Object.fromEntries(formParams.entries()));

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formParams.toString(),
        });

        const responseText = await response.text();
        console.log(`[MetaAPI] Response status: ${response.status}, body: ${responseText.substring(0, 1000)}`);

        let result: any;
        try {
            result = JSON.parse(responseText);
        } catch {
            return { success: false, error: `Non-JSON response: ${responseText.substring(0, 200)}` };
        }

        if (!response.ok || result.error) {
            // Extract FULL error details including blame_field_specs
            const errObj = result.error || {};
            const blameFields = errObj.error_data?.blame_field_specs
                ? ` [Blame fields: ${JSON.stringify(errObj.error_data.blame_field_specs)}]`
                : '';
            const userMsg = errObj.error_user_msg ? ` — ${errObj.error_user_msg}` : '';
            const errorMsg = `${errObj.message || 'Unknown error'}${userMsg}${blameFields} (code: ${errObj.code || 'N/A'}, subcode: ${errObj.error_subcode || 'N/A'})`;
            console.error(`[MetaAPI] FULL Error on ${endpoint}:`, JSON.stringify(result.error || result));
            return { success: false, error: errorMsg };
        }

        console.log(`[MetaAPI] Success on ${endpoint}:`, result.id || JSON.stringify(result));
        return { success: true, data: result };
    } catch (err: any) {
        console.error(`[MetaAPI] Exception on ${endpoint}:`, err?.message || err);
        return { success: false, error: err?.message || 'Network error calling Meta API' };
    }
}

// ─── Helper: Meta API GET ───────────────────────────────────────

async function metaApiGet(
    endpoint: string,
    accessToken: string,
    params: Record<string, string> = {}
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const searchParams = new URLSearchParams({ access_token: accessToken, ...params });
        const url = `${META_API_BASE}${endpoint}?${searchParams.toString()}`;
        console.log(`[MetaAPI] GET ${META_API_BASE}${endpoint}`);

        const response = await fetch(url);
        const responseText = await response.text();
        console.log(`[MetaAPI] GET Response status: ${response.status}, body: ${responseText.substring(0, 500)}`);

        let result: any;
        try {
            result = JSON.parse(responseText);
        } catch {
            return { success: false, error: `Non-JSON response: ${responseText.substring(0, 200)}` };
        }

        if (!response.ok || result.error) {
            const errorMsg = result.error?.message || JSON.stringify(result.error) || `HTTP ${response.status}`;
            return { success: false, error: errorMsg };
        }

        return { success: true, data: result };
    } catch (err: any) {
        return { success: false, error: err?.message || 'Network error' };
    }
}

// ─── Helper: Fetch product_set_id from catalog ──────────────────

async function fetchProductSetId(
    catalogId: string,
    accessToken: string
): Promise<{ success: boolean; productSetId?: string; error?: string }> {
    console.log(`[MetaAPI] Fetching product sets for catalog: ${catalogId}`);
    const result = await metaApiGet(
        `/${catalogId}/product_sets`,
        accessToken,
        { fields: 'id,name' }
    );

    if (!result.success) {
        return { success: false, error: `Failed to fetch product sets: ${result.error}` };
    }

    const productSets = result.data?.data;
    if (!productSets || productSets.length === 0) {
        return { success: false, error: 'No product sets found in catalog. Please add products to your catalog first.' };
    }

    console.log(`[MetaAPI] Found ${productSets.length} product sets. Using first: ${productSets[0].id} (${productSets[0].name})`);
    return { success: true, productSetId: productSets[0].id };
}

// ─── Helper: Upload image to Meta and get image_hash ────────────

async function uploadImageToMeta(
    adAccountId: string,
    accessToken: string,
    imageUrl: string
): Promise<{ success: boolean; imageHash?: string; error?: string }> {
    try {
        console.log(`[MetaAPI] Downloading image from: ${imageUrl}`);
        const imgResponse = await fetch(imageUrl);
        if (!imgResponse.ok) {
            return { success: false, error: `Failed to download image (HTTP ${imgResponse.status}). Is the URL public?` };
        }

        const imgBlob = await imgResponse.blob();
        console.log(`[MetaAPI] Image downloaded, size: ${imgBlob.size} bytes, type: ${imgBlob.type}`);

        // Upload to Meta's ad images endpoint as multipart form data
        const formData = new FormData();
        formData.append('access_token', accessToken);
        // Use a generic filename with proper extension
        const ext = imgBlob.type.includes('png') ? '.png' : '.jpg';
        formData.append('filename', new File([imgBlob], `ad_image${ext}`, { type: imgBlob.type }));

        const uploadUrl = `${META_API_BASE}/${adAccountId}/adimages`;
        console.log(`[MetaAPI] Uploading image to: ${uploadUrl}`);

        const uploadResp = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });

        const uploadText = await uploadResp.text();
        console.log(`[MetaAPI] Image upload response: ${uploadText.substring(0, 500)}`);

        let uploadResult: any;
        try {
            uploadResult = JSON.parse(uploadText);
        } catch {
            return { success: false, error: `Non-JSON image upload response: ${uploadText.substring(0, 200)}` };
        }

        if (uploadResult.error) {
            return { success: false, error: `Image upload failed: ${uploadResult.error.message}` };
        }

        // Meta returns: { images: { "filename": { hash: "...", ... } } }
        const images = uploadResult.images;
        if (images) {
            const firstKey = Object.keys(images)[0];
            const hash = images[firstKey]?.hash;
            if (hash) {
                console.log(`[MetaAPI] Image hash obtained: ${hash}`);
                return { success: true, imageHash: hash };
            }
        }

        // Fallback: check body.images format
        const bodyImages = uploadResult.body?.images;
        if (bodyImages) {
            const firstKey = Object.keys(bodyImages)[0];
            const hash = bodyImages[firstKey]?.hash;
            if (hash) {
                console.log(`[MetaAPI] Image hash from body: ${hash}`);
                return { success: true, imageHash: hash };
            }
        }

        console.error(`[MetaAPI] Unexpected image upload response structure:`, JSON.stringify(uploadResult).substring(0, 500));
        return { success: false, error: 'Image uploaded but no hash returned. Unexpected response format.' };
    } catch (err: any) {
        console.error(`[MetaAPI] Image upload exception:`, err?.message || err);
        return { success: false, error: `Image upload error: ${err?.message}` };
    }
}

// ─── Helper: Fetch Instagram Actor ID from Page ──────────────────

async function fetchInstagramActorId(
    pageId: string,
    accessToken: string
): Promise<{ success: boolean; instagramActorId?: string; error?: string }> {
    console.log(`[MetaAPI] Fetching Instagram Actor ID for page: ${pageId}`);
    // Request the instagram_accounts connected to the page
    const result = await metaApiGet(
        `/${pageId}`,
        accessToken,
        { fields: 'instagram_accounts{id},page_backed_instagram_accounts{id}' }
    );

    if (!result.success) {
        // Fallback: simply don't return an ID, will use page backing
        return { success: false, error: `Failed to fetch Instagram account: ${result.error}` };
    }

    // Try connected Instagram account first
    if (result.data?.instagram_accounts?.data?.length > 0) {
        const id = result.data.instagram_accounts.data[0].id;
        console.log(`[MetaAPI] Found connected Instagram account: ${id}`);
        return { success: true, instagramActorId: id };
    }

    // Fallback to page-backed Instagram account
    if (result.data?.page_backed_instagram_accounts?.data?.length > 0) {
        const id = result.data.page_backed_instagram_accounts.data[0].id;
        console.log(`[MetaAPI] Found page-backed Instagram account: ${id}`);
        return { success: true, instagramActorId: id };
    }

    return { success: false, error: 'No Instagram account connected to this page.' };
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
    }

    // Advantage audience
    targeting.targeting_automation = { advantage_audience: 1 };

    return targeting;
}

// ─── Convert budget to cents ────────────────────────────────────

function budgetToCents(amount: number): number {
    return Math.round(amount * 100);
}

// ─── Format datetime for Meta API ───────────────────────────────

function formatMetaDateTime(dt: string, isStart = false): string {
    try {
        const date = new Date(dt);
        if (isStart) {
            const now = new Date();
            const bufferTime = new Date(now.getTime() + 5 * 60000);
            if (date <= bufferTime) {
                console.log(`[MetaAPI] Adjusted start_time from ${date.toISOString()} to ${bufferTime.toISOString()} to avoid past-date error.`);
                return bufferTime.toISOString();
            }
        }
        return date.toISOString();
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
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid authorization token' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        let payloadRaw = '';
        try {
            payloadRaw = await req.text();
            console.log('[CreateCampaign] Raw payload received length:', payloadRaw.length);
        } catch (e) {
            console.error('[CreateCampaign] Failed to read request text:', e);
            return new Response(JSON.stringify({ error: 'Failed to read request body' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        let payload: CampaignPayload;
        try {
            payload = JSON.parse(payloadRaw);
        } catch (e) {
            const errStr = String(e);
            console.error('[CreateCampaign] Failed to parse JSON payload. Raw snippet:', payloadRaw.substring(0, 200));
            await supabase.from('meta_account_selections').upsert({
                user_id: user.id,
                webhook_response: { error: 'JSON Parse Error', details: errStr, raw: payloadRaw.substring(0, 1000) },
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
            return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Validate required fields
        const { meta_connection } = payload;
        if (!meta_connection?.ad_account_id) {
            return new Response(
                JSON.stringify({ error: 'Missing ad_account_id. Please connect your Meta account first.' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }
        if (!meta_connection?.access_token) {
            return new Response(
                JSON.stringify({ error: 'Missing access token. Please reconnect your Meta account.' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const accessToken = meta_connection.access_token;
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

        // ─── Step 0: Verify access token is valid ───────────────────
        console.log('[CreateCampaign] Step 0 - Verifying access token...');
        try {
            const verifyUrl = `${META_API_BASE}/me?access_token=${accessToken}`;
            const verifyResp = await fetch(verifyUrl);
            const verifyData = await verifyResp.json();
            console.log('[CreateCampaign] Token verify result:', JSON.stringify(verifyData));

            if (verifyData.error) {
                await supabase.from('meta_account_selections').upsert({
                    user_id: user.id,
                    webhook_response: {
                        debug_step: 'token_verify',
                        error: verifyData.error,
                        timestamp: new Date().toISOString()
                    },
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

                return new Response(
                    JSON.stringify({ success: false, error: `Access token invalid: ${verifyData.error.message}. Please reconnect your Meta account.` }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        } catch (verifyErr: any) {
            console.warn('[CreateCampaign] Token verification failed:', verifyErr?.message);
        }

        // ─── Pre-flight: Validate page_id ──────────────────────────
        if (!pageId) {
            console.error('[CreateCampaign] FATAL: pageId is missing.');
            await supabase.from('meta_account_selections').upsert({
                user_id: user.id,
                webhook_response: {
                    debug_step: 'preflight_validation',
                    error: 'Missing page_id',
                    payload_page_id: payload.page_id,
                    meta_connection_page_id: meta_connection.page_id,
                    timestamp: new Date().toISOString()
                },
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

            return new Response(
                JSON.stringify({ success: false, error: 'Missing Facebook Page. Please select a Page in Step 5 or reconnect your Meta account.' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

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
            // ─── Step 1: Create Campaign (matching n8n) ─────────────────

            console.log('[CreateCampaign] Step 1 - Creating Meta campaign...');

            let metaObjective = mapObjective(payload.objective);
            // Fallback from SALES to TRAFFIC if user has no pixel, because SALES natively requires pixel/app tracking
            if (metaObjective === 'OUTCOME_SALES' && !meta_connection?.pixel_id) {
                console.log('[CreateCampaign] User has no pixel_id for OUTCOME_SALES. Falling back to OUTCOME_TRAFFIC.');
                metaObjective = 'OUTCOME_TRAFFIC';
            }

            const campaignParams: Record<string, any> = {
                name: payload.campaign_name,
                objective: metaObjective,
                status: 'PAUSED',
                special_ad_categories: [],
                is_adset_budget_sharing_enabled: false,
            };

            console.log('[CreateCampaign] Step 1 params:', JSON.stringify(campaignParams, null, 2));

            const campaignResult = await metaApiPost(`/${adAccountId}/campaigns`, accessToken, campaignParams);

            await supabase.from('meta_account_selections').upsert({
                user_id: user.id,
                webhook_response: {
                    debug_step: 'step1_campaign',
                    params: campaignParams,
                    result: campaignResult,
                    timestamp: new Date().toISOString()
                },
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

            if (!campaignResult.success) {
                throw new Error(`[Step 1 - Campaign] ${campaignResult.error}`);
            }

            results.meta_campaign_id = campaignResult.data.id;
            createdResources.push({ type: 'campaign', id: results.meta_campaign_id });
            console.log('[CreateCampaign] ✅ Campaign created:', results.meta_campaign_id);

            // ─── Step 2: Create Ad Creative (matching n8n) ──────────────

            const creativeParams: Record<string, any> = {
                name: `${payload.campaign_name} - Creative`,
            };

            const websiteUrl = payload.brief?.website_url || payload.brief?.['Website URL or social page'] || 'https://example.com';

            if (payload.asset_type === 'catalog' && payload.catalog_id) {
                // ─── CATALOG CREATIVE (matching n8n Creatives1/Creatives3 nodes) ───
                console.log('[CreateCampaign] Step 2 - Catalog creative, fetching product_set_id...');

                // Fetch real product_set_id from catalog (critical fix!)
                const psResult = await fetchProductSetId(payload.catalog_id, accessToken);
                if (!psResult.success) {
                    throw new Error(`[Step 2 - Creative] ${psResult.error}`);
                }

                // Try to get explicit Instagram Actor ID from payload, or fetch it as fallback
                let instagramActorId: string | null = payload.selected_instagram_id || payload.meta_connection?.instagram_actor_id || null;
                if (!instagramActorId) {
                    console.log('[CreateCampaign] No explicit Instagram Actor ID in payload, fetching implicitly...');
                    const igResult = await fetchInstagramActorId(pageId, accessToken);
                    instagramActorId = igResult.success ? (igResult.instagramActorId || null) : null;
                } else {
                    console.log(`[CreateCampaign] Using explicit Instagram Actor ID: ${instagramActorId}`);
                }

                creativeParams.product_set_id = psResult.productSetId;
                creativeParams.object_story_spec = {
                    page_id: pageId,
                    instagram_actor_id: instagramActorId,
                    template_data: {
                        call_to_action: { type: 'SHOP_NOW' },
                        link: websiteUrl,
                        message: payload.description || 'Check out our products!',
                        description: payload.offer || '',
                    },
                };

                console.log(`[CreateCampaign] Using product_set_id: ${psResult.productSetId} (fetched from catalog ${payload.catalog_id})`);

            } else if (payload.asset_type === 'upload' && payload.assets && payload.assets.length > 0) {
                // ─── UPLOAD CREATIVE (matching n8n adimage → Creatives nodes) ───
                const validAssets = payload.assets.filter((a) => a.file_url && a.file_url.trim() !== '');
                if (validAssets.length === 0) {
                    throw new Error('[Step 2 - Creative] All uploaded assets have empty URLs. Please re-upload your files.');
                }

                const primaryAsset = validAssets[0];
                const isVideo = primaryAsset.file_type?.startsWith('video');

                // Try to get explicit Instagram Actor ID from payload, or fetch it as fallback
                let instagramActorId: string | null = payload.selected_instagram_id || payload.meta_connection?.instagram_actor_id || null;
                if (!instagramActorId) {
                    console.log('[CreateCampaign] No explicit Instagram Actor ID in payload, fetching implicitly...');
                    const igResult = await fetchInstagramActorId(pageId, accessToken);
                    instagramActorId = igResult.success ? (igResult.instagramActorId || null) : null;
                } else {
                    console.log(`[CreateCampaign] Using explicit Instagram Actor ID: ${instagramActorId}`);
                }

                if (isVideo) {
                    creativeParams.object_story_spec = {
                        page_id: pageId,
                        instagram_actor_id: instagramActorId,
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
                    // Upload image to Meta to get image_hash (matching n8n adimage node)
                    console.log('[CreateCampaign] Step 2 - Uploading image to Meta for image_hash...');
                    const uploadResult = await uploadImageToMeta(adAccountId, accessToken, primaryAsset.file_url);

                    if (uploadResult.success && uploadResult.imageHash) {
                        // Use image_hash (the reliable way, matching n8n)
                        creativeParams.object_story_spec = {
                            page_id: pageId,
                            instagram_actor_id: instagramActorId,
                            link_data: {
                                image_hash: uploadResult.imageHash,
                                link: websiteUrl,
                                message: payload.description || payload.campaign_name,
                                name: payload.campaign_name,
                                call_to_action: { type: 'SHOP_NOW' },
                            },
                        };
                        console.log(`[CreateCampaign] Using image_hash: ${uploadResult.imageHash}`);
                    } else {
                        // Fallback: try image_url directly (may fail if URL isn't public)
                        console.warn(`[CreateCampaign] Image upload failed (${uploadResult.error}), falling back to image_url`);
                        creativeParams.object_story_spec = {
                            page_id: pageId,
                            instagram_actor_id: instagramActorId,
                            link_data: {
                                image_url: primaryAsset.file_url,
                                link: websiteUrl,
                                message: payload.description || payload.campaign_name,
                                name: payload.campaign_name,
                                call_to_action: { type: 'SHOP_NOW' },
                            },
                        };
                    }
                }
            }

            console.log('[CreateCampaign] Step 2 - Creative params:', JSON.stringify(creativeParams, null, 2));

            // Add access_token to creative params body (matching n8n)
            const creativeResult = await metaApiPost(`/${adAccountId}/adcreatives`, accessToken, creativeParams);

            await supabase.from('meta_account_selections').upsert({
                user_id: user.id,
                webhook_response: {
                    debug_step: 'step2_creative',
                    creative_params_keys: Object.keys(creativeParams),
                    page_id: pageId,
                    asset_type: payload.asset_type,
                    catalog_id: payload.catalog_id,
                    has_product_set_id: !!creativeParams.product_set_id,
                    result: creativeResult,
                    timestamp: new Date().toISOString()
                },
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

            if (!creativeResult.success) {
                throw new Error(`[Step 2 - Creative] ${creativeResult.error}`);
            }

            results.meta_creative_id = creativeResult.data.id;
            createdResources.push({ type: 'creative', id: results.meta_creative_id });
            console.log('[CreateCampaign] ✅ Creative created:', results.meta_creative_id);

            // ─── Step 3: Create Ad Set (matching n8n Adsets node) ────────

            const targeting = buildTargeting(payload.brief || {});
            const adSetParams: Record<string, any> = {
                campaign_id: results.meta_campaign_id,
                name: `${payload.campaign_name} - Ad Set`,
                billing_event: 'IMPRESSIONS',
                bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
                daily_budget: budgetToCents(payload.daily_budget),
                status: 'PAUSED',
                start_time: formatMetaDateTime(payload.start_time, true),
                targeting: targeting,
            };

            if (payload.end_time) {
                adSetParams.end_time = formatMetaDateTime(payload.end_time);
            }

            // ─── Promoted Object (CRITICAL for OUTCOME_SALES) ─────────
            // Meta requires promoted_object for OUTCOME_SALES campaigns.
            // For CATALOG campaigns: use product_catalog_id + product_set_id
            // For UPLOAD campaigns: use pixel_id + custom_event_type
            // If neither is available: fall back to LINK_CLICKS optimization
            const isSalesObjective = metaObjective === 'OUTCOME_SALES';
            const isTrafficObjective = metaObjective === 'OUTCOME_TRAFFIC';

            if (payload.asset_type === 'catalog' && payload.catalog_id) {
                // CATALOG: promoted_object MUST have product_catalog_id AND product_set_id
                const promotedObject: Record<string, any> = {
                    product_catalog_id: payload.catalog_id,
                };
                if (creativeParams.product_set_id) {
                    promotedObject.product_set_id = creativeParams.product_set_id;
                }
                // When optimizing for OFFSITE_CONVERSIONS, pixel_id and custom_event_type are usually required
                if (meta_connection.pixel_id) {
                    promotedObject.pixel_id = meta_connection.pixel_id;
                    promotedObject.custom_event_type = 'PURCHASE';
                }
                adSetParams.promoted_object = promotedObject;
                adSetParams.optimization_goal = 'OFFSITE_CONVERSIONS';
                console.log('[CreateCampaign] Using CATALOG promoted_object:', JSON.stringify(adSetParams.promoted_object));
            } else if (meta_connection.pixel_id) {
                // PIXEL: promoted_object with pixel_id
                adSetParams.promoted_object = {
                    pixel_id: meta_connection.pixel_id,
                    custom_event_type: 'PURCHASE',
                };
                adSetParams.optimization_goal = 'OFFSITE_CONVERSIONS';
                console.log('[CreateCampaign] Using PIXEL promoted_object:', JSON.stringify(adSetParams.promoted_object));
            } else if (isSalesObjective || isTrafficObjective) {
                // No catalog, no pixel → can't do OFFSITE_CONVERSIONS
                // Use LINK_CLICKS which doesn't require promoted_object
                adSetParams.optimization_goal = 'LINK_CLICKS';
                // For sales without pixel/catalog, add page_id as promoted_object
                if (pageId) {
                    adSetParams.promoted_object = { page_id: pageId };
                    console.log('[CreateCampaign] Using PAGE promoted_object for sales/traffic:', pageId);
                } else {
                    console.log('[CreateCampaign] No promoted_object available, using LINK_CLICKS');
                }
            } else {
                // Other objectives (AWARENESS, ENGAGEMENT, etc.)
                adSetParams.optimization_goal = mapOptimizationGoal(payload.goal, payload.objective);
                if (meta_connection.pixel_id && isSalesObjective) {
                    adSetParams.promoted_object = {
                        pixel_id: meta_connection.pixel_id,
                        custom_event_type: 'PURCHASE',
                    };
                }
                console.log('[CreateCampaign] Using optimization_goal:', adSetParams.optimization_goal);
            }

            // Always strip OFFSITE_CONVERSIONS if lacking pixel to prevent error
            if (adSetParams.optimization_goal === 'OFFSITE_CONVERSIONS' && !meta_connection.pixel_id) {
                adSetParams.optimization_goal = 'LINK_CLICKS';
            }

            console.log('[CreateCampaign] Step 3 - Ad set params:', JSON.stringify(adSetParams, null, 2));

            let adSetResult = await metaApiPost(`/${adAccountId}/adsets`, accessToken, adSetParams);

            // If first attempt fails, retry with different strategies
            if (!adSetResult.success) {
                const firstError = adSetResult.error || '';
                console.warn('[CreateCampaign] Step 3 first attempt failed:', firstError);

                // Retry strategy 1: Keep promoted_object but try LINK_CLICKS optimization
                if (adSetParams.optimization_goal !== 'LINK_CLICKS') {
                    console.log('[CreateCampaign] Step 3 retry 1: switching to LINK_CLICKS optimization...');
                    adSetParams.optimization_goal = 'LINK_CLICKS';
                    adSetResult = await metaApiPost(`/${adAccountId}/adsets`, accessToken, adSetParams);
                }

                // Retry strategy 2: If still failing, try without promoted_object and with LANDING_PAGE_VIEWS
                if (!adSetResult.success) {
                    console.log('[CreateCampaign] Step 3 retry 2: removing promoted_object, using LANDING_PAGE_VIEWS...');
                    delete adSetParams.promoted_object;
                    adSetParams.optimization_goal = 'LANDING_PAGE_VIEWS';
                    adSetResult = await metaApiPost(`/${adAccountId}/adsets`, accessToken, adSetParams);
                }

                // Retry strategy 3: Last resort - IMPRESSIONS
                if (!adSetResult.success) {
                    console.log('[CreateCampaign] Step 3 retry 3: using IMPRESSIONS optimization...');
                    adSetParams.optimization_goal = 'IMPRESSIONS';
                    adSetResult = await metaApiPost(`/${adAccountId}/adsets`, accessToken, adSetParams);
                }

                // Keep the first error so the user sees the real reason it failed
                if (!adSetResult.success) {
                    adSetResult.error = firstError;
                }
            }

            if (!adSetResult.success) {
                await supabase.from('meta_account_selections').upsert({
                    user_id: user.id,
                    webhook_response: {
                        debug_step: 'step3_adset',
                        adset_params: adSetParams,
                        result: adSetResult,
                        timestamp: new Date().toISOString()
                    },
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
                throw new Error(`[Step 3 - Ad Set] ${adSetResult.error}`);
            }

            const adsetId = adSetResult.data.id;
            results.meta_adset_ids.push(adsetId);
            createdResources.push({ type: 'adset', id: adsetId });
            console.log('[CreateCampaign] ✅ Ad Set created:', adsetId);

            // ─── Step 4: Create Ad (matching n8n Ad node) ───────────────

            const adParams: Record<string, any> = {
                name: `${payload.campaign_name} - Ad`,
                adset_id: adsetId,
                creative: { creative_id: results.meta_creative_id },
                status: 'PAUSED',
            };

            console.log('[CreateCampaign] Step 4 - Ad params:', JSON.stringify(adParams, null, 2));

            const adResult = await metaApiPost(`/${adAccountId}/ads`, accessToken, adParams);

            if (!adResult.success) {
                throw new Error(`[Step 4 - Ad] ${adResult.error}`);
            }

            const adId = adResult.data.id;
            results.meta_ad_ids.push(adId);
            createdResources.push({ type: 'ad', id: adId });
            console.log('[CreateCampaign] ✅ Ad created:', adId);

            // ─── Step 5: Update local DB with Meta IDs ──────────────────

            const { error: updateError } = await supabase
                .from('campaigns')
                .update({
                    meta_campaign_id: results.meta_campaign_id,
                    meta_adset_id: results.meta_adset_ids[0],
                    meta_creative_id: results.meta_creative_id,
                    meta_ad_id: results.meta_ad_ids[0],
                    status: 'paused',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', payload.campaign_id)
                .eq('user_id', payload.user_id);

            if (updateError) {
                console.warn('[CreateCampaign] Failed to update local DB (campaign still created on Meta):', updateError);
            }

            // Save final success debug data
            await supabase.from('meta_account_selections').upsert({
                user_id: user.id,
                webhook_response: {
                    debug_step: 'SUCCESS',
                    results: results,
                    timestamp: new Date().toISOString()
                },
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

            console.log('[CreateCampaign] ✅ Full campaign created successfully!', results);

            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Campaign created successfully! Status: PAUSED',
                    data: {
                        ...results,
                        meta_adset_id: results.meta_adset_ids[0],
                        meta_ad_id: results.meta_ad_ids[0],
                    },
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );

        } catch (error: any) {
            console.error('[CreateCampaign] Fatal error:', error.message);
            await cleanupResources();

            // Save error debug data
            await supabase.from('meta_account_selections').upsert({
                user_id: user.id,
                webhook_response: {
                    debug_step: 'FATAL_ERROR',
                    error: error.message,
                    created_resources: createdResources,
                    timestamp: new Date().toISOString()
                },
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

            return new Response(
                JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

    } catch (error: any) {
        console.error('[CreateCampaign] Fatal outer error:', error.message);
        return new Response(
            JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
