/**
 * ═══════════════════════════════════════════════════════════════
 *  Multi-Format Meta Ads Creator
 *  Creates multiple ad creatives with different formats under
 *  an existing Ad Set, using both Asset and Catalog approaches.
 * ═══════════════════════════════════════════════════════════════
 */

// ─── Configuration ──────────────────────────────────────────────
const CONFIG = {
    ad_account_id: 'act_587145450922448',
    adset_id: '120238022737670088',
    product_set_id: '768127739383166',
    page_id: '985720861290698',
    instagram_actor_id: '2262801444197697',
    catalog_id: '1691925474835927',
    access_token: 'EAAMq7S6ZBgJsBQw433ZBBNJRKHok2SZCwXndm9ZBH2sRLU12tzySVcZA2wZATELpGnQZB1Yuxh7JmVYITCrCtISXtblKoAHfhVYv7xTbpMxhuxFI1fBZA8bkCwTZCtKSXnH3J8tfSnBNBBgQGL37sF8ZAXjVMzjWZAojTX9sCUlGe1gPPFIAwakfKeWyjQivqgUQYXfNY9oSl296aIMGcFjyQPOmSlMQSdMFVpjtQ1Y82ypAt9ODcljYqZB3maqPjyVcdplSRiNNhBFgVZAqu2cjdimn8hgjOZB8aOI2pifYZAJQnsZD',
};

const META_API_VERSION = 'v21.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// ─── Colors for console ─────────────────────────────────────────
const C = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
};

function log(icon, msg) { console.log(`${icon}  ${msg}`); }
function header(title) {
    console.log(`\n${C.cyan}${C.bold}${'='.repeat(60)}${C.reset}`);
    console.log(`${C.cyan}${C.bold}  ${title}${C.reset}`);
    console.log(`${C.cyan}${C.bold}${'='.repeat(60)}${C.reset}\n`);
}
function section(title) {
    console.log(`\n${C.yellow}${C.bold}-- ${title} ${'--'.repeat(Math.max(1, 25 - Math.floor(title.length / 2)))}${C.reset}\n`);
}

// ─── Meta API Helpers ───────────────────────────────────────────

async function metaGet(endpoint, params = {}) {
    const searchParams = new URLSearchParams({ access_token: CONFIG.access_token, ...params });
    const url = `${META_API_BASE}${endpoint}?${searchParams.toString()}`;
    log('>', `${C.dim}GET ${endpoint}${C.reset}`);

    const resp = await fetch(url);
    const data = await resp.json();

    if (!resp.ok || data.error) {
        const msg = data.error?.message || JSON.stringify(data.error) || `HTTP ${resp.status}`;
        return { ok: false, error: msg };
    }
    return { ok: true, data };
}

async function metaPost(endpoint, params) {
    const url = `${META_API_BASE}${endpoint}`;
    const form = new URLSearchParams();
    form.append('access_token', CONFIG.access_token);

    for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined) continue;
        form.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }

    log('>', `${C.dim}POST ${endpoint}${C.reset}`);

    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
    });

    const data = await resp.json();

    if (!resp.ok || data.error) {
        const err = data.error || {};
        const blameFields = err.error_data?.blame_field_specs
            ? ` [Blame: ${JSON.stringify(err.error_data.blame_field_specs)}]`
            : '';
        const userMsg = err.error_user_msg ? ` -- ${err.error_user_msg}` : '';
        const errorMsg = `${err.message || 'Unknown'}${userMsg}${blameFields} (code: ${err.code || '?'})`;
        console.error(`${C.red}   Error Detail:${C.reset}`, JSON.stringify(data.error, null, 2));
        return { ok: false, error: errorMsg };
    }
    return { ok: true, data };
}

// ─── Resolve Instagram Actor ID ─────────────────────────────────

async function resolveInstagramActorId() {
    section('Resolving Instagram Actor ID');

    // First try the provided ID by validating it
    if (CONFIG.instagram_actor_id) {
        log('>', `Validating provided IG Actor ID: ${CONFIG.instagram_actor_id}`);
        const checkResult = await metaGet(`/${CONFIG.instagram_actor_id}`, { fields: 'id,username' });
        if (checkResult.ok) {
            log('[OK]', `${C.green}Provided IG Actor ID is valid: ${checkResult.data.username || checkResult.data.id}${C.reset}`);
            return CONFIG.instagram_actor_id;
        }
        log('[!]', `${C.yellow}Provided IG Actor ID is invalid, trying to fetch from Page...${C.reset}`);
    }

    // Auto-detect from page
    const igResult = await metaGet(`/${CONFIG.page_id}`, {
        fields: 'instagram_accounts{id,username},page_backed_instagram_accounts{id},instagram_business_account{id,username}',
    });

    if (igResult.ok) {
        if (igResult.data?.instagram_business_account?.id) {
            const id = igResult.data.instagram_business_account.id;
            log('[OK]', `${C.green}Found Instagram Business Account: ${id}${C.reset}`);
            return id;
        }
        if (igResult.data?.instagram_accounts?.data?.length > 0) {
            const id = igResult.data.instagram_accounts.data[0].id;
            log('[OK]', `${C.green}Found connected Instagram Account: ${id}${C.reset}`);
            return id;
        }
        if (igResult.data?.page_backed_instagram_accounts?.data?.length > 0) {
            const id = igResult.data.page_backed_instagram_accounts.data[0].id;
            log('[OK]', `${C.green}Found Page-Backed Instagram Account: ${id}${C.reset}`);
            return id;
        }
    }

    log('[!]', `${C.yellow}No Instagram account found. Ads will be Facebook-only.${C.reset}`);
    return null;
}

// ─── Fetch Catalog Products (for Asset-based ads) ───────────────

async function fetchCatalogProducts(limit = 5) {
    section('Fetching Catalog Products for Asset-based Ads');

    const result = await metaGet(`/${CONFIG.product_set_id}/products`, {
        fields: 'id,name,image_url,url,price,retailer_id',
        limit: String(limit),
    });

    if (!result.ok) {
        log('[X]', `Failed to fetch products: ${result.error}`);
        return [];
    }

    const products = result.data?.data || [];
    log('[OK]', `Fetched ${C.bold}${products.length}${C.reset} products from catalog`);
    products.forEach((p, i) => {
        log('  ', `${C.dim}${i + 1}. ${p.name || p.retailer_id} -- ${p.image_url ? 'has image' : 'no image'}${C.reset}`);
    });

    return products;
}

// ─── Creative Builders ──────────────────────────────────────────

/**
 * 1. CATALOG -- Single Image (DPA)
 */
function buildCatalogSingleImage() {
    return {
        label: '[CATALOG] Single Image (DPA)',
        creative: {
            name: `Catalog Single Image DPA -- ${TIMESTAMP}`,
            product_set_id: CONFIG.product_set_id,
            object_story_spec: {
                page_id: CONFIG.page_id,
                template_data: {
                    message: '{{product.name}} -- Discover the offer now!',
                    link: '{{product.url}}',
                    call_to_action: { type: 'SHOP_NOW' },
                    force_single_link: true,
                },
            },
        },
    };
}

/**
 * 2. CATALOG -- Carousel (DPA)
 */
function buildCatalogCarousel() {
    return {
        label: '[CATALOG] Carousel (DPA)',
        creative: {
            name: `Catalog Carousel DPA -- ${TIMESTAMP}`,
            product_set_id: CONFIG.product_set_id,
            object_story_spec: {
                page_id: CONFIG.page_id,
                template_data: {
                    message: 'Shop the latest products -- Swipe to see more',
                    link: '{{product.url}}',
                    call_to_action: { type: 'SHOP_NOW' },
                    multi_share_end_card: true,
                },
            },
        },
    };
}

/**
 * 3. ASSET -- Single Image
 */
function buildAssetSingleImage(products) {
    const product = products[0];
    if (!product?.image_url) return null;

    return {
        label: '[ASSET] Single Image',
        creative: {
            name: `Asset Single Image -- ${TIMESTAMP}`,
            object_story_spec: {
                page_id: CONFIG.page_id,
                link_data: {
                    message: `${product.name || 'Featured Product'} -- Get it now!`,
                    link: product.url || 'https://www.facebook.com/',
                    picture: product.image_url,
                    call_to_action: { type: 'SHOP_NOW' },
                },
            },
        },
    };
}

/**
 * 4. ASSET -- Carousel
 */
function buildAssetCarousel(products) {
    const validProducts = products.filter(p => p.image_url).slice(0, 5);
    if (validProducts.length < 2) return null;

    const childAttachments = validProducts.map(p => ({
        name: p.name || 'Product',
        picture: p.image_url,
        link: p.url || 'https://www.facebook.com/',
        description: p.price || '',
        call_to_action: { type: 'SHOP_NOW' },
    }));

    return {
        label: '[ASSET] Carousel',
        creative: {
            name: `Asset Carousel -- ${TIMESTAMP}`,
            object_story_spec: {
                page_id: CONFIG.page_id,
                link_data: {
                    message: 'Amazing product collection -- Shop now!',
                    link: validProducts[0].url || 'https://www.facebook.com/',
                    child_attachments: childAttachments,
                    multi_share_optimized: true,
                    multi_share_end_card: false,
                },
            },
        },
    };
}

/**
 * 5. CATALOG -- Collection (DPA)
 */
function buildCatalogCollection(products) {
    const retailerIds = products.filter(p => p.retailer_id).map(p => p.retailer_id).slice(0, 4);

    const templateData = {
        message: 'Shop our exclusive collection',
        link: '{{product.url}}',
        call_to_action: { type: 'SHOP_NOW' },
        force_single_link: false,
    };

    if (retailerIds.length > 0) {
        templateData.retailer_item_ids = retailerIds;
    }

    return {
        label: '[CATALOG] Collection (DPA)',
        creative: {
            name: `Catalog Collection DPA -- ${TIMESTAMP}`,
            product_set_id: CONFIG.product_set_id,
            object_story_spec: {
                page_id: CONFIG.page_id,
                template_data: templateData,
            },
        },
    };
}

// ─── Main Execution ─────────────────────────────────────────────

async function main() {
    header('Multi-Format Meta Ads Creator');
    log('#', `Ad Account:        ${C.bold}${CONFIG.ad_account_id}${C.reset}`);
    log('#', `Ad Set:            ${C.bold}${CONFIG.adset_id}${C.reset}`);
    log('#', `Product Set:       ${C.bold}${CONFIG.product_set_id}${C.reset}`);
    log('#', `Page:              ${C.bold}${CONFIG.page_id}${C.reset}`);
    log('#', `Instagram Actor:   ${C.bold}${CONFIG.instagram_actor_id}${C.reset} (will validate)`);
    log('#', `Catalog:           ${C.bold}${CONFIG.catalog_id}${C.reset}`);

    // Step 0: Resolve IG Actor ID
    const resolvedIgId = await resolveInstagramActorId();

    // Step 1: Fetch products for asset-based creatives
    const products = await fetchCatalogProducts(5);

    // Step 2: Build all creative specs
    section('Building Creative Specifications');

    const specs = [
        buildCatalogSingleImage(),
        buildCatalogCarousel(),
        buildAssetSingleImage(products),
        buildAssetCarousel(products),
        buildCatalogCollection(products),
    ].filter(Boolean);

    log('#', `Prepared ${C.bold}${specs.length}${C.reset} creative specs`);

    // Step 3: Create Creatives + Ads
    const results = [];

    for (let i = 0; i < specs.length; i++) {
        const spec = specs[i];
        section(`[${i + 1}/${specs.length}] ${spec.label}`);

        // Clean up undefined values
        const creativeParams = JSON.parse(JSON.stringify(spec.creative));

        // Inject resolved IG actor ID (or remove it)
        if (creativeParams.object_story_spec) {
            if (resolvedIgId) {
                creativeParams.object_story_spec.instagram_actor_id = resolvedIgId;
            } else {
                delete creativeParams.object_story_spec.instagram_actor_id;
            }
        }

        log('#', `Creative: ${C.bold}${creativeParams.name}${C.reset}`);
        log('#', `IG Actor: ${resolvedIgId ? resolvedIgId : `${C.yellow}None (FB only)${C.reset}`}`);

        // Create the Ad Creative
        const creativeResult = await metaPost(
            `/${CONFIG.ad_account_id}/adcreatives`,
            creativeParams
        );

        if (!creativeResult.ok) {
            log('[X]', `${C.red}Creative failed: ${creativeResult.error}${C.reset}`);
            results.push({ label: spec.label, creative: 'FAILED', ad: '--' });
            continue;
        }

        const creativeId = creativeResult.data.id;
        log('[OK]', `${C.green}Creative created: ${C.bold}${creativeId}${C.reset}`);

        // Create the Ad under the existing Ad Set
        const adResult = await metaPost(`/${CONFIG.ad_account_id}/ads`, {
            name: `${creativeParams.name} -- Ad`,
            adset_id: CONFIG.adset_id,
            status: 'PAUSED',
            creative: { creative_id: creativeId },
        });

        if (!adResult.ok) {
            log('[X]', `${C.red}Ad failed: ${adResult.error}${C.reset}`);
            results.push({ label: spec.label, creative: `OK ${creativeId}`, ad: 'FAILED' });
            continue;
        }

        const adId = adResult.data.id;
        log('[OK]', `${C.green}Ad created: ${C.bold}${adId}${C.reset}`);
        results.push({ label: spec.label, creative: `OK ${creativeId}`, ad: `OK ${adId}` });
    }

    // Summary
    header('Results Summary');

    const colW = [38, 28, 28];
    console.log(`${'Format'.padEnd(colW[0])} ${'Creative'.padEnd(colW[1])} ${'Ad'.padEnd(colW[2])}`);
    console.log(`${'-'.repeat(colW[0])} ${'-'.repeat(colW[1])} ${'-'.repeat(colW[2])}`);

    for (const r of results) {
        const cIcon = r.creative.startsWith('OK') ? `${C.green}[OK]${C.reset}` : `${C.red}[X]${C.reset}`;
        const aIcon = r.ad.startsWith('OK') ? `${C.green}[OK]${C.reset}` : `${C.red}[X]${C.reset}`;
        console.log(`${r.label.padEnd(colW[0])} ${cIcon} ${r.creative.slice(0, 22).padEnd(colW[1] - 5)} ${aIcon} ${r.ad.slice(0, 22)}`);
    }

    const successCount = results.filter(r => r.ad.startsWith('OK')).length;
    const failCount = results.length - successCount;

    console.log(`\n${C.bold}Total: ${successCount} succeeded, ${failCount} failed out of ${results.length}${C.reset}`);

    if (successCount > 0) {
        console.log(`\n${C.green}${C.bold}Done! Check your Ads Manager for the new ads.${C.reset}`);
    }
}

main().catch(err => {
    console.error(`\n${C.red}${C.bold}Fatal error:${C.reset}`, err);
    process.exit(1);
});
