# Meta Select Page - New Webhooks Integration

## Overview

Updated the Meta Selection page (`/meta-select`) with new webhook endpoints and Meta-style design.

---

## Webhook Endpoints Used

### 1. Fetch Ad Accounts
**URL**: `POST https://n8n.srv1181726.hstgr.cloud/webhook-test/meta-ad-accounts`

**Request**:
```json
{
  "user_id": "uuid"
}
```

**Response**:
```json
{
  "ad_accounts": [
    {
      "id": "act_123456789",
      "name": "My Ad Account",
      "currency": "USD",
      "account_status": 1
    }
  ]
}
```

---

### 2. Fetch Pixels
**URL**: `POST https://n8n.srv1181726.hstgr.cloud/webhook-test/meta-all-pixels`

**Request**:
```json
{
  "user_id": "uuid",
  "ad_account_id": "act_123456789"
}
```

**Response**:
```json
{
  "pixels": [
    {
      "id": "123456789",
      "name": "Main Pixel",
      "ad_account_id": "act_123456789",
      "last_fired_time": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 3. Fetch Catalogs
**URL**: `POST https://n8n.srv1181726.hstgr.cloud/webhook-test/meta-all-catalogs`

**Request**:
```json
{
  "user_id": "uuid"
}
```

**Response**:
```json
{
  "catalogs": [
    {
      "id": "456789",
      "name": "Product Catalog",
      "product_count": 150
    }
  ]
}
```

---

### 4. Save Selection
**URL**: `POST https://n8n.srv1181726.hstgr.cloud/webhook-test/meta-save-selection`

**Request**:
```json
{
  "user_id": "uuid",
  "brief_id": "uuid-optional",
  "ad_account_id": "act_123456789",
  "ad_account_name": "My Ad Account",
  "pixel_id": "123456789",
  "pixel_name": "Main Pixel",
  "catalog_id": "456789",
  "catalog_name": "Product Catalog"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "selection-uuid",
    "user_id": "uuid",
    "ad_account_id": "act_123456789",
    "pixel_id": "123456789",
    "catalog_id": "456789"
  }
}
```

---

## Flow

### Step 1: Ad Account Selection
1. User navigates to `/meta-select`
2. Page calls `POST /webhook-test/meta-ad-accounts` with `user_id`
3. Displays list of ad accounts
4. User selects an account
5. Clicks "Next"

### Step 2: Pixel Selection
1. Page calls `POST /webhook-test/meta-all-pixels` with `user_id` and `ad_account_id`
2. Displays list of pixels for selected ad account
3. User selects a pixel
4. Clicks "Next"

### Step 3: Catalog Selection (Optional)
1. Page calls `POST /webhook-test/meta-all-catalogs` with `user_id`
2. Displays list of catalogs
3. User can select a catalog or skip
4. Clicks "Next"

### Step 4: Review & Confirm
1. Shows summary of all selections
2. User clicks "Confirm & Finish"
3. Page calls `POST /webhook-test/meta-save-selection` with all data
4. Redirects to `/dashboard` on success

---

## Design Changes

### Meta-Style UI
- **Clean white background** (`bg-gray-50`)
- **Facebook blue accent** (`#1877F2` / `bg-blue-600`)
- **Simple cards** with gray borders
- **Professional typography** with proper hierarchy
- **Minimal shadows** for clean look
- **Step indicator** with numbered circles and connecting lines

### Color Palette
- Primary: Blue (`#1877F2`)
- Background: Gray-50 (`#F9FAFB`)
- Cards: White with gray borders
- Text: Gray-900 (headings), Gray-600 (descriptions)
- Selected: Blue-50 background, Blue-600 border
- Hover: Gray-50 background, Gray-400 border

### Typography
- Page Title: `text-3xl font-bold`
- Step Titles: `text-2xl font-semibold`
- Card Labels: `font-semibold text-gray-900`
- Descriptions: `text-gray-600`

---

## Code Structure

### Functions
```typescript
fetchAdAccounts()      // Calls webhook-test/meta-ad-accounts
fetchPixels()          // Calls webhook-test/meta-all-pixels
fetchCatalogs()        // Calls webhook-test/meta-all-catalogs
handleSubmit()         // Calls webhook-test/meta-save-selection
```

### State Management
```typescript
[currentStep, setCurrentStep]           // 1 | 2 | 3 | 4
[loading, setLoading]                   // API call loading
[error, setError]                       // Error messages
[submitting, setSubmitting]             // Submit loading

[adAccounts, setAdAccounts]             // List of accounts
[pixels, setPixels]                     // List of pixels
[catalogs, setCatalogs]                 // List of catalogs

[selectedAdAccount, setSelectedAdAccount]   // Selected ID
[selectedPixel, setSelectedPixel]           // Selected ID
[selectedCatalog, setSelectedCatalog]       // Selected ID or null
```

---

## Testing

### Manual Test Flow
1. Go to `/meta-select?user_id=test-id`
2. Verify ad accounts load
3. Select an account → click Next
4. Verify pixels load for that account
5. Select a pixel → click Next
6. Verify catalogs load
7. Select catalog or skip → click Next
8. Verify review page shows correct data
9. Click "Confirm & Finish"
10. Verify redirect to `/dashboard`

### cURL Tests

**Test Ad Accounts:**
```bash
curl -X POST https://n8n.srv1181726.hstgr.cloud/webhook-test/meta-ad-accounts \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-user"}'
```

**Test Pixels:**
```bash
curl -X POST https://n8n.srv1181726.hstgr.cloud/webhook-test/meta-all-pixels \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-user","ad_account_id":"act_123"}'
```

**Test Catalogs:**
```bash
curl -X POST https://n8n.srv1181726.hstgr.cloud/webhook-test/meta-all-catalogs \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-user"}'
```

**Test Save:**
```bash
curl -X POST https://n8n.srv1181726.hstgr.cloud/webhook-test/meta-save-selection \
  -H "Content-Type: application/json" \
  -d '{
    "user_id":"test-user",
    "ad_account_id":"act_123",
    "ad_account_name":"Test Account",
    "pixel_id":"456",
    "pixel_name":"Test Pixel"
  }'
```

---

## Key Changes from Previous Version

### Endpoints
- ✅ Changed from single webhook to 3 separate webhooks
- ✅ Each step calls its own endpoint
- ✅ Save endpoint updated to new URL

### Design
- ✅ Changed from dark theme to light theme
- ✅ Changed from red accent to blue accent
- ✅ Simplified card design
- ✅ Added numbered step indicator
- ✅ Meta Business Manager style

### Flow
- ✅ Data fetched per step (not all at once)
- ✅ Pixels endpoint receives `ad_account_id`
- ✅ Same 4-step wizard structure

---

## Files Modified

- `src/pages/MetaSelect.tsx` - Complete rewrite with new webhooks and design

---

## Build Status

✅ Build successful
✅ No errors
✅ No warnings
✅ Ready for deployment

---

## Visual Preview

```
┌─────────────────────────────────────────────────┐
│  Meta Business Setup                            │
│  Configure your Meta advertising accounts       │
│                                                  │
│  [1]━━━━[2]━━━━[3]━━━━[4]                      │
│   Ad    Pixel  Catalog Review                   │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Select Ad Account                        │  │
│  │  Choose the ad account...                 │  │
│  │                                            │  │
│  │  ┌──────────────────────────────────┐    │  │
│  │  │ ✓ My Ad Account                  │    │  │
│  │  │   act_123456789                  │    │  │
│  │  └──────────────────────────────────┘    │  │
│  │  ┌──────────────────────────────────┐    │  │
│  │  │   Another Account                │    │  │
│  │  │   act_987654321                  │    │  │
│  │  └──────────────────────────────────┘    │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  [Back]                             [Next →]    │
└─────────────────────────────────────────────────┘
```

---

## Status

✅ **Complete and Ready**

- All webhooks integrated
- Meta-style design implemented
- Build passes
- No breaking changes to other pages

**Last Updated**: 2025-12-23
