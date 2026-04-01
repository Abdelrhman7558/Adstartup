# CLAUDE.md — Adstartup Project Memory

## What is this project?

Adstartup is a SaaS platform that lets clients connect their Meta (Facebook/Instagram) Ads account, fill out a brief, and then an AI **Media Buyer Agent** automatically creates and launches real ad campaigns on Meta on their behalf.

---

## User Flow (in order)

1. **Sign Up + Pay** — User registers and subscribes via Stripe
2. **Brief** — User fills out a detailed marketing brief (stored in Supabase, table: `briefs`)
3. **Connect Meta** — User connects their Meta Ads account via OAuth (`meta-oauth-callback` edge function), selects Ad Account / Page / Instagram / Pixel / Catalog and saves to `meta_connections` table
4. **New Campaign (popup)** — User clicks "New Campaign" button on dashboard → popup form appears with campaign questions → user submits
5. **Media Buyer Agent** — Receives the form data, fetches the user's brief from Supabase, builds a strategy, then calls the `create-meta-campaign` edge function which:
   - Creates the Campaign on Meta
   - Creates the Ad Set on Meta
   - Uploads creative assets (images/videos) to Meta
   - Creates Ad Creatives on Meta
   - Creates Ads on Meta
   - Saves all Meta IDs back to Supabase

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Edge Functions | Supabase Edge Functions (Deno/TypeScript) |
| Hosting | Vercel |
| Payments | Stripe |
| Meta Integration | Direct Meta Marketing API v21.0 via Graph API |
| File Storage | Supabase Storage (for ad creatives) |

---

## Key Files

```
src/
  pages/
    Dashboard.tsx / NewDashboard.tsx / ProductionDashboard.tsx  — main dashboards
    Brief.tsx          — brief form
    MetaSelect.tsx     — Meta account selector after OAuth
    MetaCallback.tsx   — OAuth callback handler

  components/
    AIEngine.tsx             — Media Buyer Agent UI / campaign creation flow
    AssetUpload.tsx          — creative asset upload component
    MetaAccountManager.tsx   — Meta account management

supabase/
  functions/
    create-meta-campaign/index.ts   — THE MAIN AGENT: creates full campaigns on Meta
    meta-oauth-callback/            — handles Meta OAuth token exchange
    get-ad-accounts/                — fetches Meta ad accounts
    save-meta-selections/           — saves user's Meta selections to DB
    send-asset-webhook/             — sends assets to campaign creation
    get-pages/ get-pixels/ get-catalogs/ get-instagram-accounts/

  migrations/
    (many migration files — latest ones add meta_assets tables, manager accounts, etc.)
```

---

## Database Key Tables

- `profiles` — user profile data
- `briefs` — user marketing brief (brand info, goals, audience, etc.)
- `meta_connections` — stores user's Meta access token + selected ad_account_id, page_id, pixel_id, catalog_id, instagram_actor_id
- `campaigns` — campaign records with meta_campaign_id after creation
- `ads` — ad and adset records created on Meta
- `meta_assets` — uploaded creative files (images/videos) linked to campaigns

---

## The Core Problem History (4 Months of Pain)

### Phase 1 — n8n Approach
- **What worked:** Everything — OAuth, brief saving, campaign creation, adset creation, ad creation
- **What FAILED:** Could not set specific ad formats like `SINGLE_IMAGE` or `FLEXIBLE_FORMAT` properly via n8n's Meta Ads module. n8n's Meta node abstracts too much and doesn't expose raw `asset_feed_spec` or `ad_formats` parameters.
- **Decision:** Abandon n8n for campaign creation, switch to direct API calls

### Phase 2 — Direct Meta API via Supabase Edge Function (current)
- **What works:** Campaign creation, Ad Set creation, image upload (`adimages` endpoint), basic ad creation
- **What FAILS:** Creative upload for FLEXIBLE_FORMAT and proper SINGLE_IMAGE with asset_feed_spec fails silently OR returns Meta API errors
- **Root cause identified (see below)**

---

## ROOT CAUSE of Creative/Ad Upload Bug

After reading the code in `supabase/functions/create-meta-campaign/index.ts`, the exact bug is:

### Bug 1 — FLEXIBLE_FORMAT: `object_story_spec.link_data` conflicts with `asset_feed_spec`

Current broken code (around line 1285):
```typescript
const creativeParams = {
  name: `${payload.campaign_name} - Flexible`,
  object_story_spec: {
    page_id: resolvedPageId,
    instagram_actor_id: instagramActorId,
    link_data: {           // <--- WRONG! Must NOT exist when using asset_feed_spec
      message: "...",
      link: websiteUrl,
      call_to_action: { type: 'SHOP_NOW' },
      image_hash: imageHashes[0],
    },
  },
  asset_feed_spec: {
    images: imageHashes.map(h => ({ hash: h })),
    bodies: [...],
    titles: [...],
    link_urls: [...],
    call_to_action_types: ['SHOP_NOW'],
    // MISSING: ad_formats: ['FLEXIBLE_FORMAT']   <--- MISSING!
  },
};
```

**The Meta API rule:** When using `asset_feed_spec`, the `object_story_spec` must ONLY contain `page_id` (and optionally `instagram_actor_id`). You cannot have `link_data` inside `object_story_spec` AND `asset_feed_spec` at the same time — Meta rejects this.

### Bug 2 — `ad_formats` field is missing from `asset_feed_spec`

The `asset_feed_spec` REQUIRES an `ad_formats` array. Without it, Meta does not know which format to use and returns an error.

---

## THE CORRECT FIX

### For AUTOMATIC_FORMAT (Dynamic Creative — Meta picks best format per placement):

> ⚠️ **v21.0 UPDATE:** `FLEXIBLE_FORMAT` is NO LONGER VALID in API v20+. The correct value is `AUTOMATIC_FORMAT`.
> Also: the AdSet MUST have `is_dynamic_creative: true` for `asset_feed_spec` to work.

```typescript
// AdSet — MUST include is_dynamic_creative: true
const adSetParams = {
  // ...
  is_dynamic_creative: true,   // REQUIRED for asset_feed_spec creatives
};

// Creative — ONLY page_id in object_story_spec
const creativeParams = {
  name: `${payload.campaign_name} - Flexible`,
  object_story_spec: {
    page_id: resolvedPageId,
    // NO instagram_actor_id when using asset_feed_spec
    // NO link_data — mutually exclusive with asset_feed_spec
  },
  asset_feed_spec: {
    images: imageHashes.map(h => ({ hash: h })),
    bodies: [{ text: payload.description || 'Check this out!' }],
    titles: [{ text: payload.campaign_name }],
    descriptions: payload.offer ? [{ text: payload.offer }] : [{ text: '' }],
    link_urls: [{ website_url: websiteUrl }],
    call_to_action_types: ['SHOP_NOW'],
    ad_formats: ['AUTOMATIC_FORMAT'],  // ✅ CORRECT in v21.0 (was FLEXIBLE_FORMAT — now invalid)
  },
};
```

### For SINGLE_IMAGE (one image, fixed format):

**Option A — Simple (no asset_feed_spec, use object_story_spec.link_data):**
```typescript
const creativeParams = {
  name: creativeName,
  object_story_spec: {
    page_id: resolvedPageId,
    ...(instagramActorId ? { instagram_actor_id: instagramActorId } : {}),
    link_data: {
      message: payload.description || '',
      link: websiteUrl,
      image_hash: uploadedImageHash,
      call_to_action: { type: 'SHOP_NOW' },
    },
  },
};
```

**Option B — With asset_feed_spec (supports A/B text testing):**
```typescript
const creativeParams = {
  name: creativeName,
  object_story_spec: {
    page_id: resolvedPageId,
    ...(instagramActorId ? { instagram_actor_id: instagramActorId } : {}),
    // NO link_data!
  },
  asset_feed_spec: {
    images: [{ hash: uploadedImageHash }],
    bodies: [{ text: bodyText1 }, { text: bodyText2 }],  // up to 5
    titles: [{ text: title1 }],
    descriptions: [{ text: description }],
    link_urls: [{ website_url: websiteUrl }],
    call_to_action_types: ['SHOP_NOW'],
    ad_formats: ['SINGLE_IMAGE'],  // REQUIRED
  },
};
```

---

## Meta Marketing API Reference (Most Important Endpoints)

All calls go to: `https://graph.facebook.com/v21.0`

| Step | Endpoint | Method | Purpose |
|---|---|---|---|
| 1 | `/{ad_account_id}/campaigns` | POST | Create campaign |
| 2 | `/{ad_account_id}/adsets` | POST | Create ad set |
| 3 | `/{ad_account_id}/adimages` | POST (multipart) | Upload image → get hash |
| 3b | `/{ad_account_id}/advideos` | POST (multipart) | Upload video → get video_id |
| 4 | `/{ad_account_id}/adcreatives` | POST | Create creative (uses hash/video_id) |
| 5 | `/{ad_account_id}/ads` | POST | Create ad (links creative to adset) |

### Image Upload Response Format:
```json
{
  "images": {
    "filename.jpg": {
      "hash": "abc123...",
      "url": "https://..."
    }
  }
}
```
**Always use `images[filename].hash`**, not the URL, when creating creatives.

### Video Upload — IMPORTANT (currently skipped in code):
Videos require polling because processing takes time:
```
1. POST /{ad_account_id}/advideos → get video_id
2. GET /{video_id}?fields=status → poll until status.video_status = "ready"
3. Use video_id in creative
```

---

## Architecture Decision: Which Tool to Use?

### Verdict: **Direct Meta Marketing API via Supabase Edge Functions** is the right approach.

**Why NOT n8n:**
- n8n's Meta Ads module doesn't expose `asset_feed_spec` / `ad_formats` raw parameters
- No control over advanced format types
- Extra moving part (another service to maintain)
- Webhook latency adds unreliability

**Why NOT Windsor.ai / third-party ad platforms:**
- These are analytics/reporting tools, not ad creation automation
- They don't solve the programmatic ad creation problem
- You lose control of the creation flow

**Why NOT Meta Ads MCP (pipeboard-co/meta-ads-mcp):**
- MCP is a protocol for AI assistants to interact with Meta (useful for Claude to analyze/manage ads)
- Cannot be called from within a web app or edge function
- Good for development/debugging, not for production automated workflows
- The same underlying Meta Graph API bugs would still apply

### THE CORRECT ARCHITECTURE (already implemented, just needs the bug fixed):

```
User clicks "New Campaign"
    ↓
Frontend: campaign form popup
    ↓
Supabase Edge Function: create-meta-campaign/index.ts
    ↓
Direct Meta Marketing API v21.0:
  Step 1: POST /campaigns        → meta_campaign_id
  Step 2: POST /adsets           → meta_adset_id
  Step 3: POST /adimages         → image_hash  (for each image asset)
  Step 4: POST /adcreatives      → creative_id (using image_hash + CORRECT format)
  Step 5: POST /ads              → ad_id       (linking creative to adset)
    ↓
Update Supabase DB with all Meta IDs
```

**Fix the bug in Step 4 (described above) and it will work end-to-end.**

---

## Common Meta API Error Codes

| Code | Meaning | Fix |
|---|---|---|
| 190 | Invalid/expired access token | User needs to reconnect Meta |
| 17 | Rate limit exceeded | Exponential backoff, retry after delay |
| 100 | Invalid parameter | Check the parameter causing blame_field_specs |
| 200 | Permissions error | Check ads_management scope |
| 1487390 | Image too small | Min 600x314px for feed, check dimensions |
| 2635 | Creative policy violation | Check image/text content against Meta policies |
| 1885066 | Cannot use link_data with asset_feed_spec | Remove link_data from object_story_spec |

---

## Ad Format Rules Summary

| Format | Works With | AdSet Requirement | asset_feed_spec Required |
|---|---|---|---|
| `SINGLE_IMAGE` | object_story_spec.link_data | None | No |
| `SINGLE_IMAGE` | asset_feed_spec | `is_dynamic_creative: true` | Yes |
| `AUTOMATIC_FORMAT` | asset_feed_spec ONLY | `is_dynamic_creative: true` (MANDATORY) | Yes |
| Carousel | object_story_spec.link_data with child_attachments | None | No |
| Catalog/DPA | template_data + product_set_id | None | No |

> ❌ `FLEXIBLE_FORMAT` is **NOT valid** in API v20+. Use `AUTOMATIC_FORMAT` instead.

**Golden Rules:**
1. `link_data` inside `object_story_spec` and `asset_feed_spec` are **mutually exclusive**. Never use both.
2. Any creative using `asset_feed_spec` REQUIRES the AdSet to have `is_dynamic_creative: true`.
3. `instagram_actor_id` should NOT be used inside `object_story_spec` when using `asset_feed_spec`.

---

## Strategies in create-meta-campaign/index.ts

The edge function has a strategy engine (`selectStrategy()`) that picks one of:

| Strategy | Description | Issue |
|---|---|---|
| `flexible_blender` | Default upload mode. 1 adset, 1 flexible ad with all images | **BUG: missing `ad_formats`, has conflicting `link_data`** |
| `abo_multi_adset` | 1 adset per product, multiple ads | Works but videos skipped |
| `abo_single_ads` | 1 adset per creative, 1 ad each | Works for images |
| `catalog_format_blender` | 3 catalog ads (single, carousel, collection) | Works |
| `catalog_carousel_10` | 10 carousel catalog ads | Works |
| `catalog_carousel_isolated` | 5 isolated carousel adsets | Works |

---

## What Needs to be Done Next

1. **Fix `flexible_blender` strategy** — remove `link_data` from `object_story_spec`, add `ad_formats: ['FLEXIBLE_FORMAT']` to `asset_feed_spec`
2. **Fix `abo_multi_adset` and `abo_single_ads`** — these use `object_story_spec.link_data` which works for SINGLE_IMAGE, but verify they're not accidentally mixing with `asset_feed_spec`
3. **Add video upload support** — implement `advideos` endpoint + polling for status in `uploadImageToMeta` or a new `uploadVideoToMeta` function
4. **Objective-format validation** — prevent `FLEXIBLE_FORMAT` from being used with non-SALES/APP_PROMOTION objectives (currently could error silently)
5. **Better error surfacing** — the current code catches errors with `console.warn` and skips, but doesn't throw properly. The user gets "0 ads created" with no clear reason.

---

## Environment Variables Needed

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STRIPE_PUBLISHABLE_KEY
META_APP_ID
META_APP_SECRET
```

---

## Deployment

- Frontend: **Vercel** (see `vercel.json`)
- Edge Functions: **Supabase** (deploy with `supabase functions deploy create-meta-campaign`)
- Database migrations: `supabase db push`

---

## Important Notes for AI Agents Working on This Project

1. **Never touch n8n** — we moved away from it. All campaign creation logic lives in `supabase/functions/create-meta-campaign/index.ts`
2. **The Meta API version is v21.0** — some endpoints/fields differ from older docs
3. **Access tokens come from `meta_connections` table** — always fetch the user's token from there, never hardcode
4. **Ad accounts have the `act_` prefix** — e.g., `act_123456789`. The code already handles this.
5. **Test with PAUSED campaigns** — all created ads should start as `status: 'PAUSED'` to avoid accidental spend
6. **The `asset_feed_spec` is the modern way** — Meta is deprecating `object_story_spec.link_data` for complex creatives. Use `asset_feed_spec` with explicit `ad_formats` going forward.
7. **Catalog vs Upload** — two completely separate code paths in the edge function. Catalog uses `template_data` + `product_set_id`. Upload uses `adimages` + `adcreatives`.
8. **The `blame_field_specs` in Meta errors** — always log the full error including `error_data.blame_field_specs` — it tells you exactly which parameter is wrong.
