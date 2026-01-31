# Quick Reference: n8n Webhooks & Dashboard

## TL;DR Changes

### What Changed
- MetaSelect.tsx now uses **1 webhook** instead of 3 Edge Functions
- All data fetched **once on mount**
- Client-side **pixel filtering**
- Saves to **save-selection webhook**

### MetaSelect Flow
```
1. Component mounts
2. POST /webhook/meta-all-data with user_id
3. Receive { ad_accounts, pixels, catalogs }
4. User selects: Ad Account → Pixel → Catalog (optional)
5. POST /webhook/meta-save-selection with selections
6. Redirect to /dashboard
```

---

## n8n Webhooks

### Endpoint 1: Fetch All Data
```
POST https://n8n.srv1181726.hstgr.cloud/webhook/meta-all-data

Request:
{
  "user_id": "uuid"
}

Response:
{
  "ad_accounts": [...],
  "pixels": [...],
  "catalogs": [...]
}
```

### Endpoint 2: Save Selection
```
POST https://n8n.srv1181726.hstgr.cloud/webhook/meta-save-selection

Request:
{
  "user_id": "uuid",
  "brief_id": "uuid-optional",
  "ad_account_id": "act_xxx",
  "ad_account_name": "name",
  "pixel_id": "xxx",
  "pixel_name": "name",
  "catalog_id": "xxx-optional",
  "catalog_name": "name-optional"
}

Response:
{
  "success": true,
  "data": {...}
}
```

---

## Dashboard Structure

### Single Page (NewDashboard.tsx)
- **Left Sidebar**: Navigation icons + theme/logout
- **Main Area**: 3 switchable views

### Views

#### Home (DashboardHomeView)
- Active Ads count
- Total Impressions
- Profit/Loss

#### Ads (DashboardAdsView)
- Table of active ads
- Remove button per ad
- Kill All Ads button with confirmation

#### Assets (DashboardAssetsView)
- Grid of uploaded images/videos
- Upload button
- Edit mode with multi-select delete

---

## Code Snippets

### Fetch All Meta Data (Single Call)
```typescript
const fetchAllMetaData = async () => {
  const webhookUrl = 'https://n8n.srv1181726.hstgr.cloud/webhook/meta-all-data';

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });

  const result = await response.json();
  setAdAccounts(result.ad_accounts);
  setPixels(result.pixels);
  setCatalogs(result.catalogs);
};
```

### Client-Side Filter Pixels
```typescript
const getFilteredPixels = () => {
  if (!selectedAdAccount) return [];
  return pixels.filter(p =>
    !p.ad_account_id || p.ad_account_id === selectedAdAccount
  );
};
```

### Save Selections
```typescript
const handleSubmit = async () => {
  const webhookUrl = 'https://n8n.srv1181726.hstgr.cloud/webhook/meta-save-selection';

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      ad_account_id: selectedAdAccount,
      pixel_id: selectedPixel,
      catalog_id: selectedCatalog,
      // ...more fields
    }),
  });

  if (result.success) navigate('/dashboard');
};
```

---

## Testing Endpoints with cURL

### Test Fetch Data
```bash
curl -X POST https://n8n.srv1181726.hstgr.cloud/webhook/meta-all-data \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-user-id"}'
```

### Test Save Selection
```bash
curl -X POST https://n8n.srv1181726.hstgr.cloud/webhook/meta-save-selection \
  -H "Content-Type: application/json" \
  -d '{
    "user_id":"test-user-id",
    "ad_account_id":"act_123",
    "ad_account_name":"My Account",
    "pixel_id":"456",
    "pixel_name":"My Pixel"
  }'
```

---

## Useful Queries

### Get All User Ads (Dashboard)
```sql
SELECT * FROM active_ads
WHERE user_id = 'user_id' AND status = 'active'
ORDER BY created_at DESC
```

### Get User Assets (Dashboard)
```sql
SELECT * FROM user_assets
WHERE user_id = 'user_id'
ORDER BY created_at DESC
```

### Get Meta Selection (After Form)
```sql
SELECT * FROM meta_account_selections
WHERE user_id = 'user_id'
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| MetaSelect.tsx | ✅ Updated - single webhook |
| NewDashboard.tsx | ✅ No changes (already complete) |
| DashboardHomeView.tsx | ✅ No changes (already complete) |
| DashboardAdsView.tsx | ✅ No changes (already complete) |
| DashboardAssetsView.tsx | ✅ No changes (already complete) |

---

## Removed Code

These files/functions are NO LONGER USED:

- ❌ `supabase.auth.getSession()` from MetaSelect
- ❌ Supabase Edge Function imports
- ❌ `fetchAdAccounts()` (replaced by single fetch)
- ❌ `fetchPixels()` (client-side filtering)
- ❌ `fetchCatalogs()` (included in single fetch)

---

## Before & After

### Before (3 Edge Functions)
```
Step 1: Load → GET /functions/v1/get-ad-accounts
Step 2: Load → GET /functions/v1/get-pixels?ad_account_id=x
Step 3: Load → GET /functions/v1/get-catalogs
Submit → POST /functions/v1/save-meta-selections
```

### After (1 Webhook + Save)
```
Mount: POST /webhook/meta-all-data
Step 2: Client-side filter from received data
Submit: POST /webhook/meta-save-selection
```

**Result**: ✅ Simpler, faster, fewer API calls

---

## Environment Setup

No new environment variables needed. Uses existing:
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Webhooks are hardcoded URLs (no secrets).

---

## Troubleshooting

### "No Ad Accounts found"
- User hasn't completed Meta OAuth
- User has no Ad Accounts in Meta Business Manager

### Pixels not filtering in Step 2
- Verify `ad_account_id` field in pixel response
- Check pixel's `ad_account_id` matches selection

### Save fails
- Check webhook URL is correct
- Verify n8n workflow is active
- Check request body has all required fields

---

## Performance Tips

1. **Fetch once**: All data loaded on mount, not per step
2. **Filter client-side**: No extra API calls for filtering
3. **Lazy views**: Dashboard views unmount when switching
4. **Small bundles**: No new dependencies added

---

## Production Checklist

- [x] Single webhook endpoint working
- [x] Error messages displayed
- [x] Loading states shown
- [x] Dashboard responsive
- [x] Dark mode works
- [x] Mobile friendly
- [x] No console errors
- [x] Build passes

---

**Ready to Deploy!** 🚀
