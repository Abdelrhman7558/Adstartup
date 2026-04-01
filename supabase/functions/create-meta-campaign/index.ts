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
    pixel_id: string | null;
    pixel_name: string | null;
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

// ─── Helper: Fetch default Page ID ────────────────────────────

async function fetchDefaultPageId(
    accessToken: string
): Promise<{ success: boolean; pageId?: string; pageName?: string; error?: string }> {
    console.log('[MetaAPI] Fetching default Facebook Page...');
    const result = await metaApiGet('/me/accounts', accessToken, { fields: 'id,name', limit: '1' });
    if (result.success && result.data?.data?.length > 0) {
        return { success: true, pageId: result.data.data[0].id, pageName: result.data.data[0].name };
    }
    return { success: false, error: result.error || 'No pages found' };
}

// ─── Helper: Fetch default Catalog ID ─────────────────────────

async function fetchDefaultCatalogId(
    accessToken: string
): Promise<{ success: boolean; catalogId?: string; error?: string }> {
    console.log('[MetaAPI] Fetching default Catalog...');
    const result = await metaApiGet('/me/catalogs', accessToken, { fields: 'id,name', limit: '1' });
    if (result.success && result.data?.data?.length > 0) {
        return { success: true, catalogId: result.data.data[0].id };
    }
    return { success: false, error: result.error || 'No catalogs found' };
}

// ─── Helper: Get Page access token ────────────────────────────────────────────

async function fetchPageAccessToken(
    pageId: string,
    userAccessToken: string
): Promise<{ success: boolean; pageToken?: string; error?: string }> {
    const result = await metaApiGet(`/${pageId}`, userAccessToken, { fields: 'access_token' });
    if (result.success && result.data?.access_token) {
        return { success: true, pageToken: result.data.access_token };
    }
    return { success: false, error: result.error || 'Could not fetch page token' };
}

// ─── Helper: Get first product image URL from a product set ───────────────────

async function fetchFirstProductImageUrl(
    productSetId: string,
    accessToken: string
): Promise<string | null> {
    const result = await metaApiGet(`/${productSetId}/products`, accessToken, {
        fields: 'image_url',
        limit: '1',
    });
    if (result.success && result.data?.data?.length > 0) {
        return result.data.data[0].image_url || null;
    }
    return null;
}

// ─── Helper: Create and publish an Instant Experience for Collection DPA ──────

async function createCollectionInstantExperience(
    pageId: string,
    pageAccessToken: string,
    productSetId: string,
    campaignName: string
): Promise<{ success: boolean; canvasId?: string; canvasUrl?: string; error?: string }> {
    try {
        console.log(`[MetaAPI] Creating Instant Experience (canvas) for Collection DPA`);
        const canvasResult = await metaApiPost(`/${pageId}/canvases`, pageAccessToken, {
            name: `${campaignName} - Collection IE`,
            body_elements: JSON.stringify([{
                element_type: 'PRODUCT_SET',
                product_set_id: productSetId,
                item_headline: '{{product.name}}',
                item_description: '{{product.current_price strip_zeros:true}}',
                max_items: 4,
                item_image_source: 'CATALOG_IMAGE',
            }]),
            is_hidden: false,
        });

        if (!canvasResult.success) {
            return { success: false, error: `Canvas creation failed: ${canvasResult.error}` };
        }

        const canvasId = canvasResult.data?.id;
        if (!canvasId) {
            return { success: false, error: 'Canvas created but no ID returned' };
        }

        // Publish the canvas
        const publishResult = await metaApiPost(`/${canvasId}`, pageAccessToken, {
            is_published: true,
        });

        if (!publishResult.success && !publishResult.data?.success) {
            console.warn(`[MetaAPI] Canvas publish warning: ${publishResult.error}`);
        }

        const canvasUrl = `https://fb.com/canvas_doc/${canvasId}/`;
        console.log(`[MetaAPI] ✅ Canvas created & published: ${canvasId}`);
        return { success: true, canvasId, canvasUrl };
    } catch (err: any) {
        return { success: false, error: err?.message || 'Canvas creation error' };
    }
}

// ─── Helper: Fetch Instagram Actor ID (robust 4-tier fallback + create) ──────

async function fetchInstagramActorId(
    pageId: string,
    accessToken: string,
    adAccountId?: string
): Promise<{ success: boolean; instagramActorId?: string; error?: string }> {
    console.log(`[MetaAPI] Fetching Instagram Actor ID (page: ${pageId}, adAccount: ${adAccountId || 'N/A'})`);

    // ── Method 1: Ad Account's connected Instagram accounts (MOST RELIABLE) ──
    if (adAccountId) {
        try {
            const acctResult = await metaApiGet(
                `/${adAccountId}/instagram_accounts`,
                accessToken,
                { fields: 'id,username' }
            );
            console.log(`[MetaAPI] Method 1 raw response:`, JSON.stringify(acctResult.data || acctResult.error).substring(0, 500));
            if (acctResult.success && acctResult.data?.data?.length > 0) {
                const id = acctResult.data.data[0].id;
                console.log(`[MetaAPI] ✅ Method 1: Found Instagram via Ad Account: ${id}`);
                return { success: true, instagramActorId: id };
            }
            console.log(`[MetaAPI] Method 1: No Instagram accounts on ad account.`);
        } catch (e: any) {
            console.warn(`[MetaAPI] Method 1 exception:`, e?.message);
        }
    }

    // ── Method 2: Page nested fields ──
    try {
        const result = await metaApiGet(
            `/${pageId}`,
            accessToken,
            { fields: 'instagram_accounts{id,username},page_backed_instagram_accounts{id},instagram_business_account{id}' }
        );
        console.log(`[MetaAPI] Method 2 raw response:`, JSON.stringify(result.data || result.error).substring(0, 500));

        if (result.success) {
            if (result.data?.instagram_accounts?.data?.length > 0) {
                const id = result.data.instagram_accounts.data[0].id;
                console.log(`[MetaAPI] ✅ Method 2a: Found connected Instagram: ${id}`);
                return { success: true, instagramActorId: id };
            }
            if (result.data?.instagram_business_account?.id) {
                const id = result.data.instagram_business_account.id;
                console.log(`[MetaAPI] ✅ Method 2b: Found Instagram Business: ${id}`);
                return { success: true, instagramActorId: id };
            }
            if (result.data?.page_backed_instagram_accounts?.data?.length > 0) {
                const id = result.data.page_backed_instagram_accounts.data[0].id;
                console.log(`[MetaAPI] ✅ Method 2c: Found page-backed IG: ${id}`);
                return { success: true, instagramActorId: id };
            }
        }
        console.log(`[MetaAPI] Method 2: No Instagram in page fields.`);
    } catch (e: any) {
        console.warn(`[MetaAPI] Method 2 exception:`, e?.message);
    }

    // ── Method 3: Separate page_backed_instagram_accounts GET endpoint ──
    try {
        const pbiResult = await metaApiGet(
            `/${pageId}/page_backed_instagram_accounts`,
            accessToken,
            { fields: 'id' }
        );
        console.log(`[MetaAPI] Method 3 raw response:`, JSON.stringify(pbiResult.data || pbiResult.error).substring(0, 500));
        if (pbiResult.success && pbiResult.data?.data?.length > 0) {
            const id = pbiResult.data.data[0].id;
            console.log(`[MetaAPI] ✅ Method 3: Found page-backed IG: ${id}`);
            return { success: true, instagramActorId: id };
        }
        console.log(`[MetaAPI] Method 3: No page-backed IG accounts found.`);
    } catch (e: any) {
        console.warn(`[MetaAPI] Method 3 exception:`, e?.message);
    }

    // ── Method 4: CREATE a page-backed Instagram account (NUCLEAR OPTION) ──
    // If no existing IG account was found, create one. Every FB page can have
    // a page-backed Instagram account created via POST.
    console.log(`[MetaAPI] Method 4: Attempting to CREATE page-backed Instagram account for page ${pageId}...`);
    try {
        const createResult = await metaApiPost(
            `/${pageId}/page_backed_instagram_accounts`,
            accessToken,
            {}
        );
        console.log(`[MetaAPI] Method 4 raw response:`, JSON.stringify(createResult.data || createResult.error).substring(0, 500));
        if (createResult.success && createResult.data?.id) {
            const id = createResult.data.id;
            console.log(`[MetaAPI] ✅ Method 4: CREATED page-backed Instagram account: ${id}`);
            return { success: true, instagramActorId: id };
        }
        console.warn(`[MetaAPI] Method 4: Create failed:`, createResult.error);
    } catch (e: any) {
        console.warn(`[MetaAPI] Method 4 exception:`, e?.message);
    }

    return { success: false, error: 'No Instagram account found or created via any method.' };
}


// ─── Helper: Fetch first valid Pixel for Ad Account ───────────

async function fetchPixelForAccount(
    adAccountId: string,
    accessToken: string
): Promise<{ success: boolean; pixelId?: string; error?: string }> {
    console.log(`[MetaAPI] Fetching pixels for account: ${adAccountId}`);
    const result = await metaApiGet(
        `/${adAccountId}/adspixels`,
        accessToken,
        { fields: 'id,name' }
    );

    if (!result.success) {
        return { success: false, error: `Failed to fetch pixels: ${result.error}` };
    }

    const pixels = result.data?.data;
    if (!pixels || pixels.length === 0) {
        return { success: false, error: 'No pixels found for this ad account.' };
    }

    console.log(`[MetaAPI] Found ${pixels.length} pixels. Using first: ${pixels[0].id} (${pixels[0].name})`);
    return { success: true, pixelId: pixels[0].id };
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
    targeting.targeting_automation = { advantage_audience: 0 };

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

// ─── Strategy Selection Engine (T.O.S Framework) ───────────────

interface StrategyConfig {
    name: string;
    display_name: string;
    budget_type: 'CBO' | 'ABO';
    campaign_budget_optimization: boolean;
    adset_count: number | 'per_product' | 'per_creative';
    ads_per_adset: number | 'flexible';
    daily_budget_per_adset: number;
    flexible_ad: boolean;
    optimization_goal: string;
    is_catalog: boolean;
    description: string;
}

function selectStrategy(assetType: string, brief: Record<string, any>, payload: CampaignPayload): StrategyConfig {
    const isCatalog = assetType === 'catalog';
    const assetsCount = payload.assets?.length || 0;
    const dailyBudget = payload.daily_budget || 500;

    // Strategy override from payload or brief
    const strategyOverride = (payload as any).strategy_override || brief?.strategy;

    if (strategyOverride) {
        console.log(`[Agent] Strategy override detected: ${strategyOverride}`);
    }

    // ─── CATALOG STRATEGIES ─────────────────────────────────────
    if (isCatalog) {
        switch (strategyOverride) {
            case 'catalog_carousel_10':
                return {
                    name: 'catalog_carousel_10',
                    display_name: 'ABO – 10 Carousel Ads per Single Ad Set',
                    budget_type: 'ABO',
                    campaign_budget_optimization: false,
                    adset_count: 1,
                    ads_per_adset: 10,
                    daily_budget_per_adset: 500,
                    flexible_ad: false,
                    optimization_goal: 'OFFSITE_CONVERSIONS',
                    is_catalog: true,
                    description: 'One audience. One budget. Ten carousel stories.',
                };
            case 'catalog_carousel_isolated':
                return {
                    name: 'catalog_carousel_isolated',
                    display_name: 'ABO – Single Carousel Ad per Ad Set',
                    budget_type: 'ABO',
                    campaign_budget_optimization: false,
                    adset_count: 5,
                    ads_per_adset: 1,
                    daily_budget_per_adset: 150,
                    flexible_ad: false,
                    optimization_goal: 'OFFSITE_CONVERSIONS',
                    is_catalog: true,
                    description: 'One carousel. One ad set. One budget. No interference.',
                };
            default:
                // Default catalog: Catalog Format Blender (3 format ads)
                return {
                    name: 'catalog_format_blender',
                    display_name: 'Catalog Format Blender – 3 Ads Campaign',
                    budget_type: 'ABO',
                    campaign_budget_optimization: false,
                    adset_count: 1,
                    ads_per_adset: 3,
                    daily_budget_per_adset: dailyBudget || 500,
                    flexible_ad: false,
                    optimization_goal: 'OFFSITE_CONVERSIONS',
                    is_catalog: true,
                    description: 'One audience. One budget. Three formats. Let users decide.',
                };
        }
    }

    // ─── UPLOAD STRATEGIES ──────────────────────────────────────
    switch (strategyOverride) {
        case 'abo_multi_adset':
            return {
                name: 'abo_multi_adset',
                display_name: 'ABO Multi-Adset & Ads',
                budget_type: 'ABO',
                campaign_budget_optimization: false,
                adset_count: 'per_product',
                ads_per_adset: Math.min(Math.max(assetsCount, 3), 5),
                daily_budget_per_adset: 250,
                flexible_ad: false,
                optimization_goal: 'OFFSITE_CONVERSIONS',
                is_catalog: false,
                description: 'One product. One ad set. Fixed budget. Multiple clean creatives.',
            };
        case 'abo_single_ads':
            return {
                name: 'abo_single_ads',
                display_name: 'ABO Single-Ads',
                budget_type: 'ABO',
                campaign_budget_optimization: false,
                adset_count: 'per_creative',
                ads_per_adset: 1,
                daily_budget_per_adset: 250,
                flexible_ad: false,
                optimization_goal: 'OFFSITE_CONVERSIONS',
                is_catalog: false,
                description: 'One creative. One ad set. One budget. No bias.',
            };
        case 'dual_format':
            // Dual format: AdSet 1 = Single Image, AdSet 2 = Flexible — same campaign
            return {
                name: 'dual_format',
                display_name: 'Dual Format — Single Image + Flexible (same campaign)',
                budget_type: 'ABO',
                campaign_budget_optimization: false,
                adset_count: 2,
                ads_per_adset: 1,
                daily_budget_per_adset: Math.ceil((dailyBudget || 500) / 2),
                flexible_ad: true,
                optimization_goal: 'OFFSITE_CONVERSIONS',
                is_catalog: false,
                description: 'Two ad sets. One Single Image ad. One Flexible ad. Same campaign. Let Meta find the winner.',
            };
        default:
            // Default upload: Flexible Blender Mode
            return {
                name: 'flexible_blender',
                display_name: 'Flexible Single Adset & Ad (Blender Mode)',
                budget_type: 'ABO',
                campaign_budget_optimization: false,
                adset_count: 1,
                ads_per_adset: 'flexible',
                daily_budget_per_adset: dailyBudget || 500,
                flexible_ad: true,
                optimization_goal: 'OFFSITE_CONVERSIONS',
                is_catalog: false,
                description: 'One ad set. One ad. All creatives inside. Let the algorithm blend.',
            };
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
            console.error('[CreateCampaign] Failed to parse JSON payload. Raw snippet:', payloadRaw.substring(0, 200));
            return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Validate required fields
        const { meta_connection } = payload;

        // ─── Resolve Account & Token (Crucial for Manager accounts) ───
        let accessToken: string | null = null;
        let rawAccountId = payload.account_id || meta_connection?.ad_account_id;

        // Priority 1: Manager Specific Account Token
        if (payload.account_id) {
            const { data: managerAcc } = await supabase
                .from('manager_meta_accounts')
                .select('access_token')
                .eq('user_id', user.id)
                .eq('account_id', payload.account_id)
                .maybeSingle();

            if (managerAcc?.access_token) {
                console.log(`[CreateCampaign] Using specific access token for managed account.`);
                accessToken = managerAcc.access_token;
            }
        }

        // Priority 2: Fallback to connection token
        if (!accessToken) {
            accessToken = meta_connection?.access_token;
        }

        if (!rawAccountId) {
            return new Response(
                JSON.stringify({ error: 'Missing ad_account_id. Please connect your Meta account first.' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!accessToken) {
            return new Response(
                JSON.stringify({ error: 'Missing access token. Please reconnect your Meta account.' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const adAccountId = rawAccountId.startsWith('act_') ? rawAccountId : `act_${rawAccountId}`;

        let pageId: string | null = payload.page_id || meta_connection.page_id || null;

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
                return new Response(
                    JSON.stringify({ success: false, error: `Access token invalid: ${verifyData.error.message}. Please reconnect your Meta account.` }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        } catch (verifyErr: any) {
            console.warn('[CreateCampaign] Token verification failed:', verifyErr?.message);
        }

        if (!pageId) {
            console.log('[CreateCampaign] Page ID missing from payload. Attempting auto-fetch...');
            const pageResult = await fetchDefaultPageId(accessToken);
            if (pageResult.success) {
                pageId = pageResult.pageId!;
                console.log(`[CreateCampaign] ✅ Auto-resolved Page ID: ${pageId} (${pageResult.pageName})`);
            } else {
                console.error('[CreateCampaign] FATAL: Page ID missing and auto-fetch failed.');
                return new Response(
                    JSON.stringify({ success: false, error: 'Missing Facebook Page. Please connect a Page or reconnect your Meta account.' }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }
        const resolvedPageId = pageId as string;

        // ─── Fetch User Brief ───────────────────────────────────────
        let userBrief: Record<string, any> = payload.brief || {};
        try {
            const { data: briefRecord } = await supabase
                .from('campaign_briefs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (briefRecord) {
                // Merge brief data (could be stored as 'data' JSON or flat columns)
                userBrief = { ...userBrief, ...(briefRecord.data || briefRecord) };
                console.log('[Agent] Brief loaded from campaign_briefs:', Object.keys(userBrief).length, 'fields');
            } else {
                console.warn('[Agent] No brief found in campaign_briefs. Using payload brief.');
            }
        } catch (briefErr: any) {
            console.warn('[Agent] Failed to fetch brief:', briefErr?.message);
        }

        // ─── Select Campaign Strategy ───────────────────────────────
        const strategy = selectStrategy(payload.asset_type, userBrief, payload);
        console.log('[Agent] Selected strategy:', JSON.stringify({
            name: strategy.name,
            display_name: strategy.display_name,
            budget_type: strategy.budget_type,
            adset_count: strategy.adset_count,
            ads_per_adset: strategy.ads_per_adset,
            flexible_ad: strategy.flexible_ad,
        }));

        const results: Record<string, any> = {
            meta_campaign_id: null,
            meta_adset_ids: [],
            meta_creative_id: null,
            meta_ad_ids: [],
            strategy: strategy.name,
        };

        const createdResources: { type: string; id: string }[] = [];

        async function cleanupResources() {
            console.log('[Cleanup] Deleting created resources in reverse order...');
            for (const res of [...createdResources].reverse()) {
                try {
                    await metaApiPost(`/${res.id}`, accessToken as string, { status: 'DELETED' });
                    console.log(`[Cleanup] Deleted ${res.type}: ${res.id}`);
                } catch (e: any) {
                    console.error(`[Cleanup] Failed to delete ${res.type}: ${res.id}`, e.message);
                }
            }
        }

        try {
            // ─── Step 1: Create Campaign (matching n8n) ─────────────────

            // ─── Pre-resolve Pixel ID (BEFORE objective fallback decision) ─────
            // IMPORTANT: Always validate pixel against the ACTUAL ad account via Meta API,
            // because stored pixel IDs may belong to a different account.

            // 1. Collect candidate pixel IDs from all sources
            const candidatePixels: string[] = [];
            if (payload.pixel_id && payload.pixel_id !== 'null' && payload.pixel_id !== 'undefined' && payload.pixel_id !== '') {
                candidatePixels.push(payload.pixel_id);
            }
            if (meta_connection?.pixel_id && meta_connection.pixel_id !== 'null') {
                candidatePixels.push(meta_connection.pixel_id);
            }

            // Check meta_connections DB for additional pixel candidates
            const { data: connPixel } = await supabase
                .from('meta_connections')
                .select('pixel_id')
                .eq('user_id', user.id)
                .eq('is_connected', true)
                .maybeSingle();
            if (connPixel?.pixel_id && !candidatePixels.includes(connPixel.pixel_id)) {
                candidatePixels.push(connPixel.pixel_id);
            }

            console.log(`[CreateCampaign] Candidate pixels from DB/payload: [${candidatePixels.join(', ')}]`);

            // 2. Fetch VALID pixels from Meta API for the ACTUAL ad account
            let resolvedPixelId: string | null = null;
            const accountPixelsResult = await fetchPixelForAccount(adAccountId, accessToken as string);

            if (accountPixelsResult.success && accountPixelsResult.pixelId) {
                // fetchPixelForAccount returns the first pixel; let's also check if any candidate matches
                // For a full match, we need to fetch all pixels... let's use metaApiGet directly
                const allPixelsResult = await metaApiGet(
                    `/${adAccountId}/adspixels`,
                    accessToken as string,
                    { fields: 'id,name' }
                );

                const accountPixelIds: string[] = (allPixelsResult.data?.data || []).map((p: any) => p.id);
                console.log(`[CreateCampaign] Valid pixels for account ${adAccountId}: [${accountPixelIds.join(', ')}]`);

                // 3. Check if any candidate pixel belongs to this account
                for (const candidate of candidatePixels) {
                    if (accountPixelIds.includes(candidate)) {
                        resolvedPixelId = candidate;
                        console.log(`[CreateCampaign] ✅ Candidate pixel ${candidate} is valid for this account.`);
                        break;
                    } else {
                        console.warn(`[CreateCampaign] ⚠️ Candidate pixel ${candidate} does NOT belong to account ${adAccountId}. Skipping.`);
                    }
                }

                // 4. If no candidate matched, use the first pixel from the account
                if (!resolvedPixelId && accountPixelIds.length > 0) {
                    resolvedPixelId = accountPixelIds[0];
                    console.log(`[CreateCampaign] Using account's first pixel: ${resolvedPixelId}`);
                }
            } else {
                console.warn(`[CreateCampaign] Could not fetch pixels from Meta API for account ${adAccountId}: ${accountPixelsResult.error}`);
            }

            const hasValidPixel = !!resolvedPixelId;
            console.log(`[CreateCampaign] Final Resolved Pixel ID: ${resolvedPixelId}, valid: ${hasValidPixel}`);

            let metaObjective = mapObjective(payload.objective);
            // Fallback from SALES to TRAFFIC if user has no pixel (using resolved pixel, not just payload)
            if (metaObjective === 'OUTCOME_SALES' && !hasValidPixel && payload.asset_type !== 'catalog') {
                console.log('[CreateCampaign] User has no valid pixel_id for OUTCOME_SALES. Falling back to OUTCOME_TRAFFIC.');
                metaObjective = 'OUTCOME_TRAFFIC';
            }

            const campaignParams: Record<string, any> = {
                name: payload.campaign_name,
                objective: metaObjective,
                status: 'PAUSED',
                special_ad_categories: [],
                is_adset_budget_sharing_enabled: strategy.campaign_budget_optimization ? true : false,
            };

            // CBO campaigns need campaign-level budget
            if (strategy.budget_type === 'CBO') {
                campaignParams.daily_budget = budgetToCents(payload.daily_budget);
                campaignParams.is_adset_budget_sharing_enabled = true;
            }

            console.log('[CreateCampaign] Step 1 params:', JSON.stringify(campaignParams, null, 2));

            const campaignResult = await metaApiPost(`/${adAccountId}/campaigns`, accessToken, campaignParams);

            if (!campaignResult.success) {
                throw new Error(`[Step 1 - Campaign] ${campaignResult.error}`);
            }

            results.meta_campaign_id = campaignResult.data.id;
            createdResources.push({ type: 'campaign', id: results.meta_campaign_id });
            console.log('[CreateCampaign] ✅ Campaign created:', results.meta_campaign_id);

            // ─── Step 2: Create AdSet ─────────────────────────────────

            console.log('[CreateCampaign] Step 2 - Creating Meta AdSet...');

            // Fetch Instagram Actor ID if not provided
            let instagramActorId = payload.selected_instagram_id || meta_connection?.instagram_actor_id;
            if (!instagramActorId && pageId) {
                const igResult = await fetchInstagramActorId(pageId, accessToken, adAccountId);
                if (igResult.success) {
                    instagramActorId = igResult.instagramActorId;
                    console.log(`[CreateCampaign] ✅ Auto-resolved Instagram Actor ID: ${instagramActorId}`);
                } else {
                    console.warn('[CreateCampaign] ⚠️ Could not find Instagram Actor ID:', igResult.error);
                    console.warn('[CreateCampaign] Will proceed without instagram_actor_id — creatives may fail on Instagram placements.');
                }
            }
            console.log(`[CreateCampaign] Final Instagram Actor ID: ${instagramActorId || 'NONE'}`);


            // Catalog Support: Fetch product_set_id if needed
            let productSetId = null;
            let catalogId = payload.catalog_id || meta_connection?.catalog_id;

            if (payload.asset_type === 'catalog') {
                if (!catalogId) {
                    console.log('[CreateCampaign] Catalog ID missing. Attempting auto-fetch...');
                    const catResult = await fetchDefaultCatalogId(accessToken);
                    if (catResult.success) {
                        catalogId = catResult.catalogId!;
                        console.log(`[CreateCampaign] ✅ Auto-resolved Catalog ID: ${catalogId}`);
                    }
                }

                if (catalogId) {
                    console.log(`[CreateCampaign] Catalog mode detected. Fetching product sets for catalog: ${catalogId}`);
                    const psResult = await fetchProductSetId(catalogId, accessToken);
                    if (psResult.success) {
                        productSetId = psResult.productSetId;
                        console.log(`[CreateCampaign] Using product_set_id: ${productSetId}`);
                    } else {
                        console.warn(`[CreateCampaign] Warning: Failed to fetch product_set_id: ${psResult.error}`);
                    }
                } else {
                    console.warn('[CreateCampaign] Catalog mode but no Catalog ID found.');
                }
            }

            // Use strategy budget (ABO: per-adset budget, CBO: no adset budget)
            const adsetBudget = strategy.budget_type === 'ABO'
                ? budgetToCents(strategy.daily_budget_per_adset || payload.daily_budget)
                : undefined;

            // flexible_blender and dual_format use asset_feed_spec — REQUIRES is_dynamic_creative: true on AdSet
            const needsDynamicCreative = strategy.name === 'flexible_blender' || strategy.name === 'dual_format';

            const adSetParams: Record<string, any> = {
                name: `${payload.campaign_name} - AdSet`,
                campaign_id: results.meta_campaign_id,
                billing_event: 'IMPRESSIONS',
                optimization_goal: mapOptimizationGoal(payload.goal, payload.objective),
                bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
                ...(adsetBudget ? { daily_budget: adsetBudget } : {}),
                start_time: formatMetaDateTime(payload.start_time, true),
                end_time: payload.end_time ? formatMetaDateTime(payload.end_time) : undefined,
                status: 'PAUSED',
                targeting: buildTargeting(payload.brief),
                destination_type: payload.asset_type === 'catalog' ? 'SHOPPING_APP' : 'WEBSITE',
                ...(needsDynamicCreative ? { is_dynamic_creative: true } : {}),
            };

            // Enhanced Promoted Object (using pre-resolved pixel)
            if (metaObjective === 'OUTCOME_SALES') {
                const promotedObj: Record<string, any> = {
                    custom_event_type: 'PURCHASE',
                };

                // Use the pre-resolved pixel
                if (hasValidPixel) {
                    console.log(`[CreateCampaign] Adding Pixel ID to promoted_object: ${resolvedPixelId}`);
                    promotedObj.pixel_id = resolvedPixelId;
                }

                // Add Product Set if in Catalog mode
                if (productSetId) {
                    console.log(`[CreateCampaign] Adding Product Set ID to promoted_object: ${productSetId}`);
                    promotedObj.product_set_id = productSetId;
                    adSetParams.destination_type = undefined;
                }

                // Only add promoted_object if we have at least Pixel or Product Set
                if (promotedObj.pixel_id || promotedObj.product_set_id) {
                    console.log(`[CreateCampaign] Final promoted_object:`, JSON.stringify(promotedObj));
                    adSetParams.promoted_object = promotedObj;
                } else {
                    console.warn(`[CreateCampaign] SALES objective but no Pixel or Product Set. Will fallback to TRAFFIC on failure.`);
                }
            }

            // Fallback for destination_type if still undefined and not sales
            if (!adSetParams.destination_type && !adSetParams.promoted_object) {
                console.log(`[CreateCampaign] Falling back to destination_type: WEBSITE`);
                adSetParams.destination_type = 'WEBSITE';
            }

            console.log('[CreateCampaign] Step 2 Final params:', JSON.stringify(adSetParams, null, 2));

            let adSetResult = await metaApiPost(`/${adAccountId}/adsets`, accessToken, adSetParams);

            // ─── UNIVERSAL RETRY: If AdSet fails with SALES objective, fallback to TRAFFIC ─────
            if (!adSetResult.success && metaObjective === 'OUTCOME_SALES') {
                console.warn(`[CreateCampaign] ⚠️ AdSet creation FAILED with SALES objective. Falling back to TRAFFIC...`);
                console.warn(`[CreateCampaign] Original error: ${adSetResult.error}`);

                // Delete the SALES campaign
                try {
                    await metaApiPost(`/${results.meta_campaign_id}`, accessToken, { status: 'DELETED' });
                    console.log(`[CreateCampaign] Deleted SALES campaign: ${results.meta_campaign_id}`);
                    createdResources.pop(); // Remove from cleanup list
                } catch (e: any) {
                    console.warn(`[CreateCampaign] Failed to delete old campaign: ${e.message}`);
                }

                // Recreate campaign with TRAFFIC objective
                metaObjective = 'OUTCOME_TRAFFIC';
                const trafficCampaignParams = {
                    ...campaignParams,
                    objective: 'OUTCOME_TRAFFIC',
                };
                console.log('[CreateCampaign] Recreating campaign with TRAFFIC:', JSON.stringify(trafficCampaignParams, null, 2));
                const retryCampaignResult = await metaApiPost(`/${adAccountId}/campaigns`, accessToken, trafficCampaignParams);

                if (!retryCampaignResult.success) {
                    throw new Error(`[Step 1 Retry - Campaign TRAFFIC] ${retryCampaignResult.error}`);
                }

                results.meta_campaign_id = retryCampaignResult.data.id;
                createdResources.push({ type: 'campaign', id: results.meta_campaign_id });
                console.log('[CreateCampaign] ✅ Campaign recreated with TRAFFIC:', results.meta_campaign_id);

                // Rebuild AdSet params for TRAFFIC (no promoted_object needed)
                adSetParams.campaign_id = results.meta_campaign_id;
                adSetParams.optimization_goal = 'LINK_CLICKS';
                adSetParams.destination_type = 'WEBSITE';
                delete adSetParams.promoted_object;

                console.log('[CreateCampaign] Step 2 Retry params:', JSON.stringify(adSetParams, null, 2));
                adSetResult = await metaApiPost(`/${adAccountId}/adsets`, accessToken, adSetParams);
            }

            if (!adSetResult.success) {
                throw new Error(`[Step 2 - AdSet] ${adSetResult.error}`);
            }

            results.meta_adset_id = adSetResult.data.id;
            results.meta_adset_ids = [results.meta_adset_id];
            createdResources.push({ type: 'adset', id: results.meta_adset_id });
            console.log('[CreateCampaign] ✅ AdSet created:', results.meta_adset_id);

            let lastAdError: string | undefined = '';


            // ─── Step 3: Create Creatives & Ads DIRECTLY via Meta API ──────
            // (No n8n webhook — everything done here)

            console.log('[CreateCampaign] Step 3 - Creating Creatives & Ads directly via Meta API. Strategy:', strategy.name);

            // Use catalogId from Step 2
            const websiteUrl = userBrief.website_url || userBrief.websiteUrl || payload.brief?.website_url || payload.brief?.websiteUrl || '';
            if (!websiteUrl) {
                throw new Error('Missing website URL. Please add your website URL to your marketing brief before creating a campaign.');
            }

            if (strategy.is_catalog) {
                // ═══ CATALOG STRATEGIES ═══════════════════════════════════
                if (strategy.name === 'catalog_format_blender') {
                    // 3 Ads: Single Image, Carousel, Collection
                    const formats = [
                        {
                            name: `${payload.campaign_name} - Single Image`,
                            template_data: {
                                message: payload.description || 'Shop now!',
                                link: websiteUrl,
                                call_to_action: { type: 'SHOP_NOW' },
                                force_single_link: true,
                            },
                        },
                        {
                            name: `${payload.campaign_name} - Carousel`,
                            template_data: {
                                message: payload.description || 'Browse our collection!',
                                link: websiteUrl,
                                call_to_action: { type: 'SHOP_NOW' },
                                multi_share_end_card: true,
                            },
                        },
                    ];

                    // ── Single Image + Carousel ads (DPA via template_data) ──
                    for (const fmt of formats) {
                        const creativeParams: Record<string, any> = {
                            name: fmt.name,
                            object_story_spec: {
                                page_id: resolvedPageId,
                                ...(instagramActorId ? { instagram_actor_id: instagramActorId } : {}),
                                template_data: fmt.template_data,
                            },
                            ...(productSetId ? { product_set_id: productSetId } : {}),
                        };

                        console.log(`[CreateCampaign] Creating catalog creative: ${fmt.name}`);
                        const creativeResult = await metaApiPost(`/${adAccountId}/adcreatives`, accessToken as string, creativeParams);
                        if (!creativeResult.success) {
                            lastAdError = creativeResult.error;
                            console.warn(`[CreateCampaign] ⚠️ Creative failed: ${creativeResult.error}. Skipping.`);
                            continue;
                        }

                        const creativeId = creativeResult.data.id;
                        createdResources.push({ type: 'creative', id: creativeId });
                        console.log(`[CreateCampaign] ✅ Creative created: ${creativeId}`);

                        const adResult = await metaApiPost(`/${adAccountId}/ads`, accessToken as string, {
                            name: `${fmt.name} - Ad`,
                            adset_id: results.meta_adset_id,
                            creative: { creative_id: creativeId },
                            status: 'PAUSED',
                        });
                        if (adResult.success) {
                            results.meta_ad_ids.push(adResult.data.id);
                            createdResources.push({ type: 'ad', id: adResult.data.id });
                            console.log(`[CreateCampaign] ✅ Ad created: ${adResult.data.id}`);
                        } else {
                            lastAdError = adResult.error;
                            console.warn(`[CreateCampaign] ⚠️ Ad creation failed: ${adResult.error}`);
                        }
                    }

                    // ── Collection ad (Instant Experience + cover image) ──
                    if (productSetId) {
                        console.log(`[CreateCampaign] Creating Collection ad via Instant Experience...`);

                        // Step 1: Get page access token (canvas API requires it)
                        const pageTokenResult = await fetchPageAccessToken(resolvedPageId, accessToken as string);
                        if (!pageTokenResult.success) {
                            console.warn(`[CreateCampaign] ⚠️ Could not get page token for Collection ad: ${pageTokenResult.error}`);
                        } else {
                            const pageToken = pageTokenResult.pageToken!;

                            // Step 2: Create & publish Instant Experience
                            const ieResult = await createCollectionInstantExperience(
                                resolvedPageId,
                                pageToken,
                                productSetId,
                                payload.campaign_name
                            );

                            if (!ieResult.success) {
                                console.warn(`[CreateCampaign] ⚠️ Instant Experience creation failed: ${ieResult.error}`);
                            } else {
                                // Step 3: Get a product image to use as cover
                                let coverImageHash: string | null = null;
                                const productImageUrl = await fetchFirstProductImageUrl(productSetId, accessToken as string);
                                if (productImageUrl) {
                                    const uploadResult = await uploadImageToMeta(adAccountId, accessToken as string, productImageUrl);
                                    if (uploadResult.success) {
                                        coverImageHash = uploadResult.imageHash!;
                                    }
                                }

                                // Step 4: Create Collection creative
                                const collectionCreativeParams: Record<string, any> = {
                                    name: `${payload.campaign_name} - Collection`,
                                    object_story_spec: {
                                        page_id: resolvedPageId,
                                        link_data: {
                                            message: payload.description || 'Discover more products!',
                                            link: ieResult.canvasUrl,
                                            call_to_action: {
                                                type: 'SHOP_NOW',
                                                value: { link: ieResult.canvasUrl },
                                            },
                                            ...(coverImageHash ? { image_hash: coverImageHash } : {}),
                                        },
                                    },
                                    // NOTE: No product_set_id here — canvas already contains it
                                };

                                const collCreativeResult = await metaApiPost(`/${adAccountId}/adcreatives`, accessToken as string, collectionCreativeParams);
                                if (!collCreativeResult.success) {
                                    lastAdError = collCreativeResult.error;
                                    console.warn(`[CreateCampaign] ⚠️ Collection creative failed: ${collCreativeResult.error}`);
                                } else {
                                    const collCreativeId = collCreativeResult.data.id;
                                    createdResources.push({ type: 'creative', id: collCreativeId });
                                    console.log(`[CreateCampaign] ✅ Collection creative: ${collCreativeId}`);

                                    const collAdResult = await metaApiPost(`/${adAccountId}/ads`, accessToken as string, {
                                        name: `${payload.campaign_name} - Collection - Ad`,
                                        adset_id: results.meta_adset_id,
                                        creative: { creative_id: collCreativeId },
                                        status: 'PAUSED',
                                    });
                                    if (collAdResult.success) {
                                        results.meta_ad_ids.push(collAdResult.data.id);
                                        createdResources.push({ type: 'ad', id: collAdResult.data.id });
                                        console.log(`[CreateCampaign] ✅ Collection Ad: ${collAdResult.data.id}`);
                                    } else {
                                        lastAdError = collAdResult.error;
                                        console.warn(`[CreateCampaign] ⚠️ Collection Ad failed: ${collAdResult.error}`);
                                    }
                                }
                            }
                        }
                    }

                } else if (strategy.name === 'catalog_carousel_10') {
                    const angles = [
                        'Best Sellers', 'New Arrivals', 'Top Rated', 'Limited Offer',
                        'Customer Favorites', 'Trending Now', 'Flash Sale', 'Featured Collection',
                        'Exclusive Deals', 'Popular Picks'
                    ];
                    for (let i = 0; i < 10; i++) {
                        const cName = `${payload.campaign_name} - Carousel ${i + 1} (${angles[i]})`;
                        const creativeParams: Record<string, any> = {
                            name: cName,
                            object_story_spec: {
                                page_id: resolvedPageId,
                                ...(instagramActorId ? { instagram_actor_id: instagramActorId } : {}),
                                template_data: {
                                    message: `${angles[i]} — ${payload.description || 'Shop now!'}`,
                                    link: websiteUrl,
                                    call_to_action: { type: 'SHOP_NOW' },
                                    multi_share_end_card: true,
                                },
                            },
                            ...(productSetId ? { product_set_id: productSetId } : {}),
                        };
                        const creativeResult = await metaApiPost(`/${adAccountId}/adcreatives`, accessToken as string, creativeParams);
                        if (!creativeResult.success) { 
                            lastAdError = creativeResult.error;
                            console.warn(`[CreateCampaign] ⚠️ Creative ${i} failed: ${creativeResult.error}`); 
                            continue; 
                        }
                        const creativeId = creativeResult.data.id;
                        createdResources.push({ type: 'creative', id: creativeId });

                        const adResult = await metaApiPost(`/${adAccountId}/ads`, accessToken as string, {
                            name: `${cName} - Ad`, adset_id: results.meta_adset_id,
                            creative: { creative_id: creativeId }, status: 'PAUSED',
                        });
                        if (adResult.success) {
                            results.meta_ad_ids.push(adResult.data.id);
                            createdResources.push({ type: 'ad', id: adResult.data.id });
                        }
                    }

                } else if (strategy.name === 'catalog_carousel_isolated') {
                    const angles = ['Story A', 'Story B', 'Story C', 'Story D', 'Story E'];
                    for (let i = 0; i < 5; i++) {
                        const cName = `${payload.campaign_name} - Carousel ${angles[i]}`;
                        const creativeParams: Record<string, any> = {
                            name: cName,
                            object_story_spec: {
                                page_id: resolvedPageId,
                                ...(instagramActorId ? { instagram_actor_id: instagramActorId } : {}),
                                template_data: {
                                    message: `${angles[i]} — ${payload.description || 'Shop now!'}`,
                                    link: websiteUrl,
                                    call_to_action: { type: 'SHOP_NOW' },
                                    multi_share_end_card: true,
                                },
                            },
                            ...(productSetId ? { product_set_id: productSetId } : {}),
                        };
                        const creativeResult = await metaApiPost(`/${adAccountId}/adcreatives`, accessToken as string, creativeParams);
                        if (!creativeResult.success) { 
                            lastAdError = creativeResult.error;
                            console.warn(`[CreateCampaign] ⚠️ Isolated creative ${i} failed: ${creativeResult.error}`); 
                            continue; 
                        }
                        const creativeId = creativeResult.data.id;
                        createdResources.push({ type: 'creative', id: creativeId });

                        const adResult = await metaApiPost(`/${adAccountId}/ads`, accessToken as string, {
                            name: `${cName} - Ad`, adset_id: results.meta_adset_id,
                            creative: { creative_id: creativeId }, status: 'PAUSED',
                        });
                        if (adResult.success) {
                            results.meta_ad_ids.push(adResult.data.id);
                            createdResources.push({ type: 'ad', id: adResult.data.id });
                        }
                    }
                }

            } else {
                // ═══ UPLOAD STRATEGIES ════════════════════════════════════
                const assets = payload.assets || [];

                if (strategy.name === 'flexible_blender') {
                    // Flexible Ad: upload all images, build asset_feed_spec
                    const imageHashes: string[] = [];
                    const videoIds: string[] = [];

                    for (const asset of assets) {
                        if (asset.file_type?.startsWith('image/')) {
                            const uploadResult = await uploadImageToMeta(adAccountId, accessToken as string, asset.file_url);
                            if (uploadResult.success && uploadResult.imageHash) {
                                imageHashes.push(uploadResult.imageHash);
                            }
                        }
                        // Video upload requires different approach (advideos endpoint) — skip for now
                    }

                    if (imageHashes.length > 0) {
                        // Build asset_feed_spec for flexible ad
                        // RULE: When using asset_feed_spec, object_story_spec must ONLY have page_id
                        // (and optionally instagram_actor_id). link_data is MUTUALLY EXCLUSIVE.
                        // RULE: ad_formats is REQUIRED inside asset_feed_spec for Meta to know the format.
                        const images = imageHashes.map(hash => ({ hash }));
                        const creativeParams: Record<string, any> = {
                            name: `${payload.campaign_name} - Flexible`,
                            object_story_spec: {
                                page_id: resolvedPageId,
                                // NO link_data here — mutually exclusive with asset_feed_spec
                            },
                            asset_feed_spec: {
                                images: images,
                                bodies: [{ text: payload.description || 'Check this out!' }],
                                titles: [{ text: payload.campaign_name }],
                                descriptions: payload.offer ? [{ text: payload.offer }] : [{ text: '' }],
                                link_urls: [{ website_url: websiteUrl }],
                                call_to_action_types: ['SHOP_NOW'],
                                // AUTOMATIC_FORMAT = flexible/adaptive (replaces FLEXIBLE_FORMAT in API v20+)
                                // Requires AdSet to have is_dynamic_creative: true
                                ad_formats: ['AUTOMATIC_FORMAT'],
                            },
                        };

                        const creativeResult = await metaApiPost(`/${adAccountId}/adcreatives`, accessToken as string, creativeParams);
                        if (creativeResult.success) {
                            const creativeId = creativeResult.data.id;
                            results.meta_creative_id = creativeId;
                            createdResources.push({ type: 'creative', id: creativeId });
                            console.log(`[CreateCampaign] ✅ Flexible creative: ${creativeId}`);

                            const adResult = await metaApiPost(`/${adAccountId}/ads`, accessToken as string, {
                                name: `${payload.campaign_name} - Flexible Ad`,
                                adset_id: results.meta_adset_id,
                                creative: { creative_id: creativeId },
                                status: 'PAUSED',
                            });
                            if (adResult.success) {
                                results.meta_ad_ids.push(adResult.data.id);
                                createdResources.push({ type: 'ad', id: adResult.data.id });
                                console.log(`[CreateCampaign] ✅ Flexible ad: ${adResult.data.id}`);
                            }
                        } else {
                            lastAdError = creativeResult.error;
                            console.warn(`[CreateCampaign] ⚠️ Flexible creative failed: ${creativeResult.error}`);
                        }
                    } else {
                        console.warn('[CreateCampaign] No image hashes obtained for flexible ad. Falling back to single image ads.');
                    }

                } else if (strategy.name === 'dual_format') {
                    // ── DUAL FORMAT: AdSet 1 = Single Image, AdSet 2 = Flexible ──
                    // AdSet 1 already created in Step 2 (results.meta_adset_id)
                    // Upload all image hashes first
                    const imageHashes: string[] = [];
                    for (const asset of assets) {
                        if (asset.file_type?.startsWith('image/')) {
                            const uploadResult = await uploadImageToMeta(adAccountId, accessToken as string, asset.file_url);
                            if (uploadResult.success && uploadResult.imageHash) {
                                imageHashes.push(uploadResult.imageHash);
                                console.log(`[DualFormat] Uploaded image hash: ${uploadResult.imageHash}`);
                            } else {
                                console.warn(`[DualFormat] ⚠️ Image upload failed: ${uploadResult.error}`);
                            }
                        }
                    }

                    if (imageHashes.length === 0) {
                        throw new Error('Dual format requires at least one image. No images were uploaded successfully.');
                    }

                    // ── Create AdSet 2 for Flexible ad ──
                    // MUST have is_dynamic_creative: true for asset_feed_spec / AUTOMATIC_FORMAT
                    const dualAdsetBudget = budgetToCents(strategy.daily_budget_per_adset || Math.ceil(payload.daily_budget / 2));
                    const adSet2Params: Record<string, any> = {
                        ...adSetParams,
                        name: `${payload.campaign_name} - AdSet 2 (Flexible)`,
                        daily_budget: dualAdsetBudget,
                        is_dynamic_creative: true,
                    };
                    console.log('[DualFormat] Creating AdSet 2 for Flexible ad...');
                    const adSet2Result = await metaApiPost(`/${adAccountId}/adsets`, accessToken as string, adSet2Params);
                    let adSet2Id: string | null = null;
                    if (adSet2Result.success) {
                        adSet2Id = adSet2Result.data.id;
                        results.meta_adset_ids.push(adSet2Id);
                        createdResources.push({ type: 'adset', id: adSet2Id });
                        console.log(`[DualFormat] ✅ AdSet 2 created: ${adSet2Id}`);
                    } else {
                        console.warn(`[DualFormat] ⚠️ AdSet 2 creation failed: ${adSet2Result.error}. Will use AdSet 1 for both ads.`);
                    }

                    // ── Ad 1: Single Image (AdSet 1, first image, object_story_spec.link_data) ──
                    const singleCreativeParams = {
                        name: `${payload.campaign_name} - Single Image`,
                        object_story_spec: {
                            page_id: resolvedPageId,
                            ...(instagramActorId ? { instagram_actor_id: instagramActorId } : {}),
                            link_data: {
                                message: payload.description || '',
                                link: websiteUrl,
                                image_hash: imageHashes[0],
                                call_to_action: { type: 'SHOP_NOW' },
                            },
                        },
                    };
                    console.log('[DualFormat] Creating Single Image creative...');
                    const singleCreativeResult = await metaApiPost(`/${adAccountId}/adcreatives`, accessToken as string, singleCreativeParams);
                    if (singleCreativeResult.success) {
                        const singleCreativeId = singleCreativeResult.data.id;
                        createdResources.push({ type: 'creative', id: singleCreativeId });
                        console.log(`[DualFormat] ✅ Single Image creative: ${singleCreativeId}`);

                        const singleAdResult = await metaApiPost(`/${adAccountId}/ads`, accessToken as string, {
                            name: `${payload.campaign_name} - Single Image Ad`,
                            adset_id: results.meta_adset_id,
                            creative: { creative_id: singleCreativeId },
                            status: 'PAUSED',
                        });
                        if (singleAdResult.success) {
                            results.meta_ad_ids.push(singleAdResult.data.id);
                            createdResources.push({ type: 'ad', id: singleAdResult.data.id });
                            console.log(`[DualFormat] ✅ Single Image ad: ${singleAdResult.data.id}`);
                        } else {
                            lastAdError = singleAdResult.error;
                            console.warn(`[DualFormat] ⚠️ Single Image ad failed: ${singleAdResult.error}`);
                        }
                    } else {
                        lastAdError = singleCreativeResult.error;
                        console.warn(`[DualFormat] ⚠️ Single Image creative failed: ${singleCreativeResult.error}`);
                    }

                    // ── Ad 2: Flexible/Dynamic (AdSet 2 or AdSet 1 fallback, all images, asset_feed_spec) ──
                    // AUTOMATIC_FORMAT = adaptive/flexible format (replaces FLEXIBLE_FORMAT in API v20+)
                    // Requires AdSet to have is_dynamic_creative: true (already set on adSet2Params)
                    const flexCreativeParams: Record<string, any> = {
                        name: `${payload.campaign_name} - Flexible`,
                        object_story_spec: {
                            page_id: resolvedPageId,
                            // NO link_data — mutually exclusive with asset_feed_spec
                            // NO instagram_actor_id needed when using asset_feed_spec dynamic creative
                        },
                        asset_feed_spec: {
                            images: imageHashes.map(h => ({ hash: h })),
                            bodies: [{ text: payload.description || 'Check this out!' }],
                            titles: [{ text: payload.campaign_name }],
                            descriptions: payload.offer ? [{ text: payload.offer }] : [{ text: '' }],
                            link_urls: [{ website_url: websiteUrl }],
                            call_to_action_types: ['SHOP_NOW'],
                            // AUTOMATIC_FORMAT: Meta picks the best format per placement
                            // Replaces FLEXIBLE_FORMAT which was deprecated in API v20+
                            ad_formats: ['AUTOMATIC_FORMAT'],
                        },
                    };
                    console.log(`[DualFormat] Creating ${flexFormat} creative...`);
                    const flexCreativeResult = await metaApiPost(`/${adAccountId}/adcreatives`, accessToken as string, flexCreativeParams);
                    if (flexCreativeResult.success) {
                        const flexCreativeId = flexCreativeResult.data.id;
                        results.meta_creative_id = flexCreativeId;
                        createdResources.push({ type: 'creative', id: flexCreativeId });
                        console.log(`[DualFormat] ✅ ${flexFormat} creative: ${flexCreativeId}`);

                        const flexAdResult = await metaApiPost(`/${adAccountId}/ads`, accessToken as string, {
                            name: `${payload.campaign_name} - ${flexFormat === 'FLEXIBLE_FORMAT' ? 'Flexible' : 'Multi-Image'} Ad`,
                            adset_id: adSet2Id || results.meta_adset_id,
                            creative: { creative_id: flexCreativeId },
                            status: 'PAUSED',
                        });
                        if (flexAdResult.success) {
                            results.meta_ad_ids.push(flexAdResult.data.id);
                            createdResources.push({ type: 'ad', id: flexAdResult.data.id });
                            console.log(`[DualFormat] ✅ Flexible ad: ${flexAdResult.data.id}`);
                        } else {
                            lastAdError = flexAdResult.error;
                            console.warn(`[DualFormat] ⚠️ Flexible ad failed: ${flexAdResult.error}`);
                        }
                    } else {
                        lastAdError = flexCreativeResult.error;
                        console.warn(`[DualFormat] ⚠️ Flexible creative failed: ${flexCreativeResult.error}`);
                    }

                } else {
                    // abo_multi_adset or abo_single_ads: 1 ad per asset
                    const maxAds = strategy.name === 'abo_multi_adset' ? Math.min(assets.length, 5) : assets.length;

                    for (let i = 0; i < maxAds; i++) {
                        const asset = assets[i];
                        const cName = `${payload.campaign_name} - Creative ${i + 1}`;

                        if (asset.file_type?.startsWith('image/')) {
                            // Upload image and create ad
                            const uploadResult = await uploadImageToMeta(adAccountId, accessToken as string, asset.file_url);
                            if (!uploadResult.success || !uploadResult.imageHash) {
                                lastAdError = uploadResult.error;
                                console.warn(`[CreateCampaign] ⚠️ Image upload failed for asset ${i}: ${uploadResult.error}`);
                                continue;
                            }

                            const creativeParams = {
                                name: cName,
                                object_story_spec: {
                                    page_id: resolvedPageId as string,
                                    ...(instagramActorId ? { instagram_actor_id: instagramActorId } : {}),
                                    link_data: {
                                        message: payload.description || '',
                                        link: websiteUrl,
                                        image_hash: uploadResult.imageHash,
                                        call_to_action: { type: 'SHOP_NOW' },
                                    },
                                },
                            };

                             const creativeResult = await metaApiPost(`/${adAccountId}/adcreatives`, accessToken as string, creativeParams);
                            if (!creativeResult.success) {
                                lastAdError = creativeResult.error;
                                console.warn(`[CreateCampaign] ⚠️ Creative ${i} failed: ${creativeResult.error}`);
                                continue;
                            }
                            const creativeId = creativeResult.data.id;
                            createdResources.push({ type: 'creative', id: creativeId });

                            const adResult = await metaApiPost(`/${adAccountId}/ads`, accessToken as string, {
                                name: `${cName} - Ad`, adset_id: results.meta_adset_id,
                                creative: { creative_id: creativeId }, status: 'PAUSED',
                            });
                             if (adResult.success) {
                                results.meta_ad_ids.push(adResult.data.id);
                                createdResources.push({ type: 'ad', id: adResult.data.id });
                            } else {
                                lastAdError = adResult.error;
                            }
                        }
                        // Video assets: would require advideos upload — skipped for now
                    }
                }
            }

            // Strategy.is_catalog check remains...

            console.log(`[CreateCampaign] Step 3 complete — Created ${results.meta_ad_ids.length} ad(s) directly.`);

            if (results.meta_ad_ids.length === 0) {
                // Surface the actual Meta error code to help diagnose
                const metaErrorHint = lastAdError?.includes('1885066')
                    ? ' (Hint: link_data conflicts with asset_feed_spec — remove link_data from object_story_spec)'
                    : lastAdError?.includes('100')
                    ? ' (Hint: Invalid parameter — check blame_field_specs in logs)'
                    : lastAdError?.includes('190')
                    ? ' (Hint: Access token expired — user must reconnect Meta account)'
                    : '';
                throw new Error(`Failed to create Ad Creatives. Meta Error: ${lastAdError || 'Unknown creative failure'}${metaErrorHint}. Check edge function logs for full details.`);
            }

            // ─── Step 4: Update local DB with Meta IDs ──────────

            const { error: updateError } = await supabase
                .from('campaigns')
                .update({
                    meta_campaign_id: results.meta_campaign_id,
                    status: 'active',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', payload.campaign_id)
                .eq('user_id', payload.user_id);

            if (updateError) {
                console.error('[CreateCampaign] DB Update Error:', updateError);
            }

            // Track AdSet creation
            await supabase.from('ads').insert({
                user_id: payload.user_id,
                name: adSetParams.name,
                status: 'PAUSED',
                campaign_id: results.meta_campaign_id,
                ad_account_id: adAccountId,
                created_by: 'edge_function_adset',
                metadata: { type: 'adset', meta_adset_id: results.meta_adset_id }
            });

            // Track created Ads
            for (const adId of results.meta_ad_ids) {
                await supabase.from('ads').insert({
                    user_id: payload.user_id,
                    name: `${payload.campaign_name} - Ad`,
                    status: 'PAUSED',
                    campaign_id: results.meta_campaign_id,
                    ad_account_id: adAccountId,
                    created_by: 'edge_function_ad',
                    metadata: { type: 'ad', meta_ad_id: adId, linked_adset_id: results.meta_adset_id }
                });
            }

            results.success = true;
            results.message = `Campaign, AdSet, and ${results.meta_ad_ids.length} Ad(s) created successfully on Meta!`;

            console.log('[CreateCampaign] ✅ FULL campaign created successfully!', results);

            return new Response(
                JSON.stringify({
                    success: true,
                    message: results.message,
                    data: results,
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );


        } catch (error: any) {
            console.error('[CreateCampaign] Fatal error:', error.message);
            await cleanupResources();

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
