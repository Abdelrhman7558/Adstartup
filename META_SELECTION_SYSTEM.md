# Meta Account Selection System - Complete Implementation Guide

## 🎯 Overview

This document provides a complete blueprint for implementing a **Shopify-style Meta integration** with step-by-step selection UI and secure backend API integration.

**Key Principles:**
- ✅ Frontend never sees access tokens
- ✅ All Meta API calls server-side (n8n)
- ✅ Progressive disclosure (step-by-step selection)
- ✅ Comprehensive error handling
- ✅ Production-ready security

---

## 📊 System Architecture

```
[Frontend: /meta/select]
         ↓
    [User selects Ad Account]
         ↓
    [n8n: Get Pixels for Ad Account]
         ↓
    [User selects Pixel]
         ↓
    [n8n: Get Catalogs]
         ↓
    [User selects Catalog (optional)]
         ↓
    [n8n: Save Selections to Database]
         ↓
    [Dashboard: Data Unlocked]
```

---

## 🗄️ Database Schema (Supabase)

### Table: `meta_account_selections`

```sql
CREATE TABLE IF NOT EXISTS meta_account_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),

  -- OAuth Token (Encrypted in transit)
  access_token TEXT NOT NULL,
  business_id TEXT,

  -- Selections
  ad_account_id TEXT,
  ad_account_name TEXT,

  pixel_id TEXT,
  pixel_name TEXT,

  catalog_id TEXT NULLABLE,
  catalog_name TEXT NULLABLE,

  -- Status
  selection_completed BOOLEAN DEFAULT false,
  connected_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id),
  INDEX idx_user_id (user_id)
);
```

---

## 🎨 FRONTEND IMPLEMENTATION

### Page: `/meta/select`

#### Location: `src/pages/MetaSelect.tsx`

**Features:**
- Step 1: Ad Account Selection
- Step 2: Pixel Selection
- Step 3: Catalog Selection (Optional)
- Step 4: Confirmation & Save

**State Management:**
```typescript
- step: 1 | 2 | 3 | 4
- selectedAdAccount: string | null
- selectedPixel: string | null
- selectedCatalog: string | null
- loading: boolean
- error: string | null
- adAccounts: Array<{id, name, currency}>
- pixels: Array<{id, name}>
- catalogs: Array<{id, name}>
```

**API Calls to Backend:**

```typescript
// Step 1: Fetch Ad Accounts
GET /api/meta/ad-accounts?user_id={{user_id}}

// Step 2: Fetch Pixels
GET /api/meta/pixels?user_id={{user_id}}&ad_account_id={{selected_id}}

// Step 3: Fetch Catalogs
GET /api/meta/catalogs?user_id={{user_id}}

// Step 4: Save Selections
POST /api/meta/save-selections
{
  user_id: string
  ad_account_id: string
  pixel_id: string
  catalog_id?: string
}
```

**UI Components:**

1. **Header** - Progress indicator (Step 1/2/3/4)
2. **Step 1 Card** - Ad Account Dropdown
3. **Step 2 Card** - Pixel Dropdown (disabled until Step 1 complete)
4. **Step 3 Card** - Catalog Dropdown (optional, can skip)
5. **Step 4 Card** - Confirmation review
6. **Error Banner** - Shows errors with retry button
7. **Navigation Buttons** - Previous, Next, Confirm

**Key Features:**
- Each step loads data from backend
- User cannot progress until selection made (except Catalog)
- Loading skeleton while fetching
- Error states with actionable messages
- Confirmation shows all selections before saving
- Success message after save, redirects to dashboard

---

## 🔧 BACKEND API ENDPOINTS (n8n)

### Endpoint 1: Get Ad Accounts

**URL:** `/api/meta/ad-accounts`
**Method:** `GET`
**Query Params:** `user_id`

**Logic:**
1. Get user_id from query parameter
2. Query Supabase for `meta_account_selections` where `user_id` matches
3. Extract `access_token`
4. Call Meta Graph API: `GET /me/adaccounts?access_token={{token}}`
5. Return filtered response to frontend

**Meta API Call:**
```
GET https://graph.instagram.com/v19.0/me/adaccounts?
  fields=id,name,currency,account_status&
  access_token={{TOKEN}}
```

**Response to Frontend:**
```json
{
  "success": true,
  "data": [
    {
      "id": "act_123456789",
      "name": "My Ad Account",
      "currency": "USD",
      "account_status": 1
    }
  ],
  "error": null
}
```

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "error": "No ad accounts found"
}
```

---

### Endpoint 2: Get Pixels

**URL:** `/api/meta/pixels`
**Method:** `GET`
**Query Params:** `user_id`, `ad_account_id`

**Logic:**
1. Get `user_id` and `ad_account_id` from query
2. Query Supabase for access token
3. Call Meta Graph API: `GET /{ad_account_id}/owned_pixels`
4. Return response to frontend

**Meta API Call:**
```
GET https://graph.instagram.com/v19.0/{AD_ACCOUNT_ID}/owned_pixels?
  fields=id,name,creation_time&
  access_token={{TOKEN}}
```

**Response to Frontend:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1234567890",
      "name": "My Pixel",
      "creation_time": "2024-01-15T10:00:00+0000"
    }
  ],
  "error": null
}
```

**Error Response:**
```json
{
  "success": false,
  "data": [],
  "error": "No pixels found for this ad account"
}
```

---

### Endpoint 3: Get Catalogs

**URL:** `/api/meta/catalogs`
**Method:** `GET`
**Query Params:** `user_id`

**Logic:**
1. Get `user_id` from query
2. Query Supabase for access token and business_id
3. Call Meta Graph API: `GET /{business_id}/owned_product_catalogs`
4. Return response (optional, can be empty)

**Meta API Call:**
```
GET https://graph.instagram.com/v19.0/{BUSINESS_ID}/owned_product_catalogs?
  fields=id,name,shop_name&
  access_token={{TOKEN}}
```

**Response to Frontend:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123456789",
      "name": "My Catalog",
      "shop_name": "My Shop"
    }
  ],
  "error": null
}
```

**Optional/Empty Response:**
```json
{
  "success": true,
  "data": [],
  "error": null
}
```

---

### Endpoint 4: Save Selections

**URL:** `/api/meta/save-selections`
**Method:** `POST`
**Body:**
```json
{
  "user_id": "uuid",
  "ad_account_id": "act_123456789",
  "ad_account_name": "My Ad Account",
  "pixel_id": "1234567890",
  "pixel_name": "My Pixel",
  "catalog_id": "123456789" // optional
}
```

**Logic:**
1. Validate all required fields (user_id, ad_account_id, pixel_id)
2. Verify user_id matches authenticated session
3. Update Supabase `meta_account_selections` table
4. Set `selection_completed = true`
5. Set `connected_at = now()`
6. Return success response

**Supabase Update:**
```sql
UPDATE meta_account_selections
SET
  ad_account_id = {{ad_account_id}},
  ad_account_name = {{ad_account_name}},
  pixel_id = {{pixel_id}},
  pixel_name = {{pixel_name}},
  catalog_id = {{catalog_id}},
  selection_completed = true,
  connected_at = now(),
  updated_at = now()
WHERE user_id = {{user_id}}
```

**Response to Frontend:**
```json
{
  "success": true,
  "message": "Selections saved successfully",
  "data": {
    "user_id": "uuid",
    "ad_account_id": "act_123456789",
    "pixel_id": "1234567890"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to save selections",
  "error": "Missing required field: pixel_id"
}
```

---

## 🛡️ SECURITY IMPLEMENTATION

### 1. Token Storage

**Frontend:**
- ❌ DO NOT store access tokens in localStorage
- ❌ DO NOT log tokens to console
- ❌ DO NOT send tokens from frontend to Meta API

**Backend (n8n):**
- ✅ Store encrypted access tokens in Supabase
- ✅ Retrieve tokens only server-side
- ✅ Add token rotation logic (recommended)

### 2. User Verification

**Every Backend Endpoint Must:**
1. Receive `user_id` from frontend
2. Verify via Supabase auth (get from JWT)
3. Compare query `user_id` with auth `user_id`
4. Return 401 Unauthorized if mismatch

```typescript
// n8n Node Logic
if (queryUserId !== authUserId) {
  return { error: "Unauthorized", status: 401 };
}
```

### 3. Rate Limiting

- Implement rate limiting on n8n endpoints
- Limit: 100 requests per user per minute
- Return 429 Too Many Requests if exceeded

### 4. CORS Headers

**n8n Endpoints Must Include:**
```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

---

## ⚙️ N8N WORKFLOW STRUCTURE

### Setup: Authentication

1. **HTTP Request Node** (to Meta API)
   - Headers: `Authorization: Bearer {{access_token}}`
   - Proper error handling

2. **Supabase Query Node**
   - Get access_token from `meta_account_selections` table
   - Verify user exists

3. **Response Mapping Node**
   - Transform Meta response to frontend format
   - Handle empty results gracefully

### Workflow 1: Get Ad Accounts

```
Input (user_id)
    ↓
[Supabase] Get access_token
    ↓
[Meta API] Call /me/adaccounts
    ↓
[Transform] Map response format
    ↓
Output (JSON to Frontend)
```

### Workflow 2: Get Pixels

```
Input (user_id, ad_account_id)
    ↓
[Supabase] Get access_token
    ↓
[Meta API] Call /{ad_account_id}/owned_pixels
    ↓
[Transform] Map response format
    ↓
Output (JSON to Frontend)
```

### Workflow 3: Get Catalogs

```
Input (user_id)
    ↓
[Supabase] Get access_token
    ↓
[Meta API] Call /{business_id}/owned_product_catalogs
    ↓
[Transform] Map response format
    ↓
Output (JSON to Frontend)
```

### Workflow 4: Save Selections

```
Input (user_id, ad_account_id, pixel_id, catalog_id)
    ↓
[Validate] Check all required fields
    ↓
[Verify] User ID matches auth
    ↓
[Supabase] Update meta_account_selections
    ↓
Output (Success response)
```

---

## 🎯 FRONTEND USER FLOW

### Step 1: Ad Account Selection

```
┌─────────────────────────────────────┐
│  Step 1 of 4: Select Ad Account     │
├─────────────────────────────────────┤
│                                     │
│  Fetching your ad accounts...       │
│  [Loading spinner]                  │
│                                     │
│  Or, if loaded:                     │
│                                     │
│  [Dropdown: Select Ad Account ▼]   │
│  - My Ad Account (USD)              │
│  - Another Account (GBP)            │
│                                     │
│  [Next Button] (disabled until sel) │
│                                     │
└─────────────────────────────────────┘
```

### Step 2: Pixel Selection

```
┌─────────────────────────────────────┐
│  Step 2 of 4: Select Pixel          │
├─────────────────────────────────────┤
│                                     │
│  Fetching pixels...                 │
│  [Loading spinner]                  │
│                                     │
│  Or, if loaded:                     │
│                                     │
│  [Dropdown: Select Pixel ▼]        │
│  - My Pixel (ID: 123456789)        │
│  - Another Pixel (ID: 987654321)   │
│                                     │
│  [← Previous] [Next →] (disabled)   │
│                                     │
└─────────────────────────────────────┘
```

### Step 3: Catalog Selection (Optional)

```
┌─────────────────────────────────────┐
│  Step 3 of 4: Select Catalog        │
├─────────────────────────────────────┤
│                                     │
│  [Dropdown: Select Catalog ▼]      │
│  - My Shop Catalog                  │
│  - Another Catalog                  │
│  - None (Skip)                      │
│                                     │
│  [← Previous] [Next →]              │
│                                     │
└─────────────────────────────────────┘
```

### Step 4: Confirmation

```
┌─────────────────────────────────────┐
│  Step 4 of 4: Review & Confirm      │
├─────────────────────────────────────┤
│                                     │
│  ✓ Ad Account: My Ad Account (USD)  │
│  ✓ Pixel: My Pixel                  │
│  ✓ Catalog: My Shop Catalog         │
│                                     │
│  [Saving...]                        │
│  Or, if complete:                   │
│  [✓ Connection Successful]          │
│  Redirecting to dashboard...        │
│                                     │
│  [← Back] [Confirm & Finish]        │
│                                     │
└─────────────────────────────────────┘
```

---

## 🚨 ERROR HANDLING

### Error States

**Ad Account Fetch Fails:**
```
┌─────────────────────────────────────┐
│  ⚠️  Could not load ad accounts     │
│                                     │
│  Your Meta session may have         │
│  expired. Please reconnect.         │
│                                     │
│  [← Back to Dashboard]              │
│  [🔄 Retry]                         │
└─────────────────────────────────────┘
```

**Pixel Fetch Fails:**
```
┌─────────────────────────────────────┐
│  ⚠️  No pixels found                │
│                                     │
│  Create a pixel in Meta Business    │
│  Suite and try again.               │
│                                     │
│  [← Back] [🔄 Retry]                │
└─────────────────────────────────────┘
```

**Save Fails:**
```
┌─────────────────────────────────────┐
│  ⚠️  Failed to save selections      │
│                                     │
│  Please try again or contact        │
│  support if the problem persists.   │
│                                     │
│  [← Back] [🔄 Try Again]            │
└─────────────────────────────────────┘
```

---

## 📊 DATA FLOW DIAGRAM

### Request Flow

```
Frontend (/meta/select)
    ↓
    ├─ User clicks "Next" on Step 1
    ├─ selectedAdAccount = "act_123456789"
    ├─ API Call: GET /api/meta/pixels?user_id={{uid}}&ad_account_id={{aid}}
    ↓
Backend (n8n)
    ├─ Validate user_id
    ├─ Query Supabase for access_token
    ├─ Call Meta API: GET /{aid}/owned_pixels
    ↓
Meta Graph API (v19.0)
    ├─ Authenticate with access_token
    ├─ Return pixels array
    ↓
Backend Response
    ├─ Transform to JSON
    ├─ Return to frontend
    ↓
Frontend
    ├─ Parse JSON
    ├─ Populate dropdown
    ├─ User selects pixel
    ├─ Show Step 2 success
```

### Save Flow

```
Frontend
    ├─ User reviews all selections
    ├─ Clicks "Confirm & Finish"
    ├─ API Call: POST /api/meta/save-selections
    ├─ Body: { user_id, ad_account_id, pixel_id, catalog_id }
    ↓
Backend (n8n)
    ├─ Validate all fields
    ├─ Verify user_id matches auth
    ├─ Update Supabase:
    │  UPDATE meta_account_selections
    │  SET ad_account_id, pixel_id, ...
    │  WHERE user_id = {{uid}}
    ├─ Return success response
    ↓
Frontend
    ├─ Show success message
    ├─ Navigate to /dashboard
    ├─ Dashboard detects metaConnected = true
    ├─ Show campaign data
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Frontend Tasks
- [ ] Create `/meta/select` page component
- [ ] Implement step-based UI (1-4)
- [ ] Create state management (step, selections, loading, error)
- [ ] Add API call functions to backend
- [ ] Implement error boundaries and error messages
- [ ] Add loading skeletons
- [ ] Implement confirmation screen
- [ ] Add success redirect to dashboard
- [ ] Test all error scenarios
- [ ] Verify no tokens logged

### Backend (n8n) Tasks
- [ ] Create endpoint: GET /api/meta/ad-accounts
- [ ] Create endpoint: GET /api/meta/pixels
- [ ] Create endpoint: GET /api/meta/catalogs
- [ ] Create endpoint: POST /api/meta/save-selections
- [ ] Implement user verification on all endpoints
- [ ] Add error handling and logging
- [ ] Test with real Meta API calls
- [ ] Implement rate limiting
- [ ] Add CORS headers
- [ ] Document all endpoints

### Database Tasks
- [ ] Create `meta_account_selections` table
- [ ] Add indexes on user_id
- [ ] Enable RLS policies
- [ ] Test data integrity
- [ ] Verify constraints

### Testing Tasks
- [ ] Test successful flow end-to-end
- [ ] Test error scenarios
- [ ] Test network timeouts
- [ ] Test missing required fields
- [ ] Test unauthorized access
- [ ] Verify no token leaks
- [ ] Test on different browsers
- [ ] Load test endpoints

---

## 🔐 Security Checklist

- [ ] Access tokens encrypted in database
- [ ] No tokens in frontend localStorage
- [ ] No tokens in browser console logs
- [ ] User verification on all endpoints
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] SQL injection protection (use ORM/parameterized queries)
- [ ] HTTPS enforced
- [ ] Request validation on backend
- [ ] Response sanitization

---

## 📝 Notes

### Token Refresh Strategy
Consider implementing token refresh:
1. Store `access_token_expires_at`
2. Check expiry before each API call
3. Call Meta refresh endpoint if needed
4. Update token in Supabase

### Monitoring
Add logging for:
- Failed API calls to Meta
- Failed database updates
- User errors (for debugging)
- API response times

### Future Enhancements
1. Multiple ad account management
2. Pixel switching without re-login
3. Catalog management UI
4. Token expiry notifications
5. Advanced filtering options

---

## 📞 Support References

**Meta Graph API v19.0 Documentation:**
- https://developers.facebook.com/docs/graph-api/reference

**Ad Accounts Endpoint:**
- https://developers.facebook.com/docs/marketing-api/reference/ad-account

**Pixels Endpoint:**
- https://developers.facebook.com/docs/marketing-api/reference/owned-pixel

**Product Catalogs Endpoint:**
- https://developers.facebook.com/docs/marketing-api/reference/business-owned-product-catalog
