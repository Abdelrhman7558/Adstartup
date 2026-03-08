import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const payloadConfig = {
  ad_account_id: 'act_304428362989164',
  pixel_id: '160280524985535',
  catalog_id: '199608519676965',
  page_id: '729645653574996',
  access_token: 'EAAMq7S6ZBgJsBQr5OzKL21Ve3YD8R7ZBm17531iwTSww1umkcQA4ZCRGvxJTGITodW6d6xAABCbwVpzaLRAboIxPFEQ3e9nvsEeppg5AVRH4mA1uD6NbbLee5EMyx4zBoelZC9ZAx9RsuJVXURR9czByoF8nOZBdyj8ZCyHhpOkSQkw3rMNKt78fHIKLN9l',
  website_url: 'https://atlantis-ads.com'
};

const META_API_VERSION = 'v21.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

/**
 * Helper to call Meta API (GET)
 */
async function metaApiGet(endpoint, accessToken, params = {}) {
  try {
    const searchParams = new URLSearchParams({ access_token: accessToken, ...params });
    const url = `${META_API_BASE}${endpoint}?${searchParams.toString()}`;
    console.log(`[MetaAPI] GET ${META_API_BASE}${endpoint}`);

    const response = await fetch(url);
    const result = await response.json();

    if (!response.ok || result.error) {
      const errorMsg = result.error?.message || JSON.stringify(result.error) || `HTTP ${response.status}`;
      console.error(`[MetaAPI] GET Error: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }

    return { success: true, data: result };
  } catch (err) {
    console.error(`[MetaAPI] GET Exception: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Helper to call Meta API (POST)
 */
async function metaApiPost(endpoint, accessToken, params) {
  try {
    const url = `${META_API_BASE}${endpoint}`;
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

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formParams.toString(),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      const errObj = result.error || {};
      const blameFields = errObj.error_data?.blame_field_specs
        ? ` [Blame fields: ${JSON.stringify(errObj.error_data.blame_field_specs)}]`
        : '';
      const userMsg = errObj.error_user_msg ? ` — ${errObj.error_user_msg}` : '';
      const errorMsg = `${errObj.message || 'Unknown error'}${userMsg}${blameFields} (code: ${errObj.code || 'N/A'})`;

      console.error(`[MetaAPI] POST Error on ${endpoint}:`, JSON.stringify(result.error || result, null, 2));
      return { success: false, error: errorMsg };
    }

    return { success: true, data: result };
  } catch (err) {
    console.error(`[MetaAPI] POST Exception on ${endpoint}:`, err.message);
    return { success: false, error: err.message };
  }
}

async function runTest() {
  console.log('--- Starting Complete Campaign Creation Process ---');
  console.log(`Using Ad Account: ${payloadConfig.ad_account_id}`);
  console.log(`Using Page: ${payloadConfig.page_id}`);

  // 1. Fetch Instagram Actor ID from Page
  console.log('\n--- 1. Fetching Instagram Actor ID ---');
  let instagramActorId = null;
  const igResult = await metaApiGet(
    `/${payloadConfig.page_id}`,
    payloadConfig.access_token,
    { fields: 'instagram_accounts{id},page_backed_instagram_accounts{id},instagram_business_account{id}' }
  );

  if (igResult.data?.instagram_accounts?.data?.length > 0) {
    instagramActorId = igResult.data.instagram_accounts.data[0].id;
    console.log(`Found connected Instagram account: ${instagramActorId}`);
  } else if (igResult.data?.instagram_business_account?.id) {
    instagramActorId = igResult.data.instagram_business_account.id;
    console.log(`Found Instagram Business account: ${instagramActorId}`);
  } else if (igResult.data?.page_backed_instagram_accounts?.data?.length > 0) {
    instagramActorId = igResult.data.page_backed_instagram_accounts.data[0].id;
    console.log(`Found page-backed Instagram account: ${instagramActorId}`);
  } else {
    console.log(`No Instagram account found. Will omit instagram_actor_id in creatives.`);
  }

  // 2. Fetch Product Set ID from Catalog
  console.log('\n--- 2. Fetching Product Set ID ---');
  let productSetId = null;
  const psResult = await metaApiGet(
    `/${payloadConfig.catalog_id}/product_sets`,
    payloadConfig.access_token,
    { fields: 'id,name' }
  );

  if (psResult.success && psResult.data?.data?.length > 0) {
    productSetId = psResult.data.data[0].id;
    console.log(`Using product_set_id: ${productSetId} (${psResult.data.data[0].name})`);
  } else {
    console.error('Failed to fetch product set ID. Catalog mode requires a product set.');
    return;
  }

  // 3. Create Campaign
  console.log('\n--- 3. Creating Campaign ---');
  const campaignName = `New Meta Test - ${new Date().toISOString().split('T')[0]}`;
  const campaignParams = {
    name: campaignName,
    objective: 'OUTCOME_SALES',
    status: 'PAUSED',
    special_ad_categories: [],
    is_adset_budget_sharing_enabled: false,
  };

  const campaignResult = await metaApiPost(`/${payloadConfig.ad_account_id}/campaigns`, payloadConfig.access_token, campaignParams);
  let campaignId;
  if (campaignResult.success) {
    campaignId = campaignResult.data.id;
    console.log(`✅ Campaign created! ID: ${campaignId}`);
  } else {
    console.log('Failed to create campaign. Stopping.');
    return; // Fallback to traffic logic removed for simplicity in this specific test
  }

  // 4. Create Ad Set
  console.log('\n--- 4. Creating Ad Set ---');

  // Future start time (5 mins from now)
  const startTime = new Date(Date.now() + 5 * 60000).toISOString();

  // Define Targeting
  const targeting = {
    geo_locations: { countries: ['EG'] },
    age_min: 18,
    age_max: 65,
    targeting_optimization: "none"
  };

  // Explicitly add instagram placement if we have an actor ID
  if (!instagramActorId) {
    console.log('No Instagram Actor ID, restricting placement to Facebook only to prevent Ad creation failure.');
    targeting.publisher_platforms = ['facebook'];
  }

  const adSetParams = {
    name: `${campaignName} - AdSet ABO`,
    campaign_id: campaignId,
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'OFFSITE_CONVERSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    daily_budget: 50000, // 500 EGP in cents
    start_time: startTime,
    status: 'PAUSED',
    targeting: targeting,
    promoted_object: {
      custom_event_type: 'PURCHASE',
      pixel_id: payloadConfig.pixel_id,
      product_set_id: productSetId
    }
  };

  const adSetResult = await metaApiPost(`/${payloadConfig.ad_account_id}/adsets`, payloadConfig.access_token, adSetParams);
  let adSetId;
  if (adSetResult.success) {
    adSetId = adSetResult.data.id;
    console.log(`✅ Ad Set created! ID: ${adSetId}`);
  } else {
    console.log('Failed to create AdSet. Stopping.');
    return;
  }

  // 5. Create Creatives
  console.log('\n--- 5. Creating Ad Creatives ---');

  // Note for Flexible: Catalog ads cannot be flexible in the API in the same way standard image/video ads can. 
  // "Flexible" in Catalog usually means letting Meta handle the format (Carousel vs Single Image).
  // The closest native "FLEXIBLE" format representation for catalogs involves dynamic formats.
  // I will attempt creating a standard single image, and a standard catalog carousel (often referred to as 'flexible' representation by users).

  const creativeSpecs = [
    {
      name: `${campaignName} - Single Image Creative`,
      format: "SINGLE_IMAGE",
    },
    {
      name: `${campaignName} - Carousel (Flexible) Creative`,
      format: "CAROUSEL", // Standard catalog carousel allows for dynamic card generation per user
    }
  ];

  const creativeIds = [];

  for (const spec of creativeSpecs) {
    console.log(`\nCreating Creative: ${spec.name} (${spec.format})`);

    const templateData = {
      message: "Check out our latest products!",
      link: payloadConfig.website_url,
      call_to_action: { type: "SHOP_NOW" }
    };

    if (spec.format === 'SINGLE_IMAGE') {
      templateData.force_single_link = true;
    } else if (spec.format === 'CAROUSEL') {
      templateData.multi_share_end_card = true;
    }

    const objectStorySpec = {
      page_id: payloadConfig.page_id,
      template_data: templateData
    };

    if (instagramActorId) {
      objectStorySpec.instagram_actor_id = instagramActorId;
    }

    const params = {
      name: spec.name,
      object_story_spec: objectStorySpec,
      product_set_id: productSetId,
    };

    const result = await metaApiPost(`/${payloadConfig.ad_account_id}/adcreatives`, payloadConfig.access_token, params);
    if (result.success) {
      console.log(`✅ Creative created! ID: ${result.data.id}`);
      creativeIds.push({ id: result.data.id, format: spec.format, name: spec.name });
    } else {
      console.log(`❌ Failed to create creative: ${spec.name}`);
    }
  }

  // 6. Create Ads
  console.log('\n--- 6. Creating Ads ---');
  for (const creative of creativeIds) {
    console.log(`\nCreating Ad for Creative: ${creative.name}`);

    const params = {
      name: `${creative.name} - Ad`,
      adset_id: adSetId,
      status: 'PAUSED',
      creative: { creative_id: creative.id }
    };

    const result = await metaApiPost(`/${payloadConfig.ad_account_id}/ads`, payloadConfig.access_token, params);
    if (result.success) {
      console.log(`✅ Ad created! ID: ${result.data.id}`);
    } else {
      console.log(`❌ Failed to create ad.`);
    }
  }

  console.log('\n--- Finished Process ---');
}

runTest();
