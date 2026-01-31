# COMPLETE BOLT PROMPT: Meta Account Selection System

## 📋 SYSTEM OVERVIEW

Build a **production-ready Meta account selection flow** that mirrors Shopify's integration style. Users select their Ad Account, Pixel, and optionally Product Catalog through a guided step-by-step interface.

**Stack:**
- Frontend: React + TypeScript + Tailwind CSS
- Backend: n8n Webhooks
- Database: Supabase (PostgreSQL)
- Meta API: v19.0

**Key Features:**
✅ Step-by-step guided selection (4 steps)
✅ Server-side Meta API calls (no token exposure)
✅ Comprehensive error handling
✅ Loading states and skeletons
✅ Database persistence
✅ User authentication verification
✅ Production-ready security

---

## 🎨 FRONTEND IMPLEMENTATION

### 1. Page Component: `/meta/select`

**Create:** `src/pages/MetaSelect.tsx`

**Purpose:** Complete step-by-step selection interface for Meta assets

**Functionality:**
- Step 1: Fetch and display Ad Accounts dropdown
- Step 2: Fetch and display Pixels for selected Ad Account
- Step 3: Fetch and display Catalogs (optional)
- Step 4: Confirmation screen before saving
- Progress bar showing current step
- Navigation buttons (Previous/Next/Confirm)
- Error states with retry options
- Success state with redirect to dashboard

**State to Manage:**
```typescript
interface SelectionState {
  step: 1 | 2 | 3 | 4;
  selectedAdAccount: string | null;
  selectedPixel: string | null;
  selectedCatalog: string | null;

  adAccounts: Array<{id: string; name: string; currency: string}>;
  pixels: Array<{id: string; name: string; creation_time?: string}>;
  catalogs: Array<{id: string; name: string; shop_name?: string}>;

  loading: boolean;
  error: string | null;
  submitting: boolean;
}
```

**API Endpoints to Call:**

```typescript
// Step 1: Get Ad Accounts
const fetchAdAccounts = async (userId: string) => {
  const response = await fetch(
    `/api/meta/ad-accounts?user_id=${userId}`
  );
  return response.json();
};

// Step 2: Get Pixels (depends on Step 1)
const fetchPixels = async (userId: string, adAccountId: string) => {
  const response = await fetch(
    `/api/meta/pixels?user_id=${userId}&ad_account_id=${adAccountId}`
  );
  return response.json();
};

// Step 3: Get Catalogs
const fetchCatalogs = async (userId: string) => {
  const response = await fetch(
    `/api/meta/catalogs?user_id=${userId}`
  );
  return response.json();
};

// Step 4: Save Selections
const saveSelections = async (payload: {
  user_id: string;
  ad_account_id: string;
  ad_account_name: string;
  pixel_id: string;
  pixel_name: string;
  catalog_id?: string;
  catalog_name?: string;
}) => {
  const response = await fetch('/api/meta/save-selections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return response.json();
};
```

**UI Components to Build:**

1. **Progress Indicator**
   - Show "Step 1 of 4", "Step 2 of 4", etc.
   - Visual progress bar

2. **Step 1: Ad Account Selection**
   - Dropdown with loading state
   - Display: "Account Name (Currency)"
   - Error message if no accounts found
   - "Next" button disabled until selection

3. **Step 2: Pixel Selection**
   - Dropdown with loading state
   - Display: "Pixel Name (ID)"
   - Error message if no pixels found
   - Previous/Next buttons

4. **Step 3: Catalog Selection**
   - Optional step
   - Dropdown or "Skip" option
   - Can proceed with or without selection
   - Previous/Next buttons

5. **Step 4: Confirmation**
   - Show all selected items in card format
   - Review items before saving
   - "Confirm & Finish" button
   - Loading state during save
   - Success message with redirect timer

6. **Error Banner**
   - Displays error message at top
   - Red background
   - "Retry" button
   - Auto-dismiss on successful retry

7. **Loading Skeleton**
   - Placeholder while loading data
   - Smooth fade-in when data loads

**User Interactions:**

```
1. User arrives at /meta/select via redirect from OAuth
2. Page loads and fetches ad accounts
3. User selects an ad account
4. Page fetches pixels for that account
5. User selects a pixel
6. Page fetches catalogs (optional)
7. User optionally selects catalog or skips
8. User reviews all selections
9. User clicks "Confirm & Finish"
10. Page saves to database via backend
11. Page shows success message
12. Redirects to /dashboard after 2 seconds
```

**Styling:**
- Dark theme (gray-900 background)
- Red accent color (red-600)
- Smooth transitions between steps
- Responsive design (mobile-first)
- Proper spacing and typography
- Error states in red
- Success states in green
- Loading states with spinners

---

### 2. Utility Functions

**Create:** `src/lib/metaSelectionApi.ts`

```typescript
// Centralized API calls for Meta selection flow

export interface AdAccount {
  id: string;
  name: string;
  currency: string;
  account_status?: number;
}

export interface Pixel {
  id: string;
  name: string;
  creation_time?: string;
}

export interface Catalog {
  id: string;
  name: string;
  shop_name?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export const metaSelectionApi = {
  getAdAccounts: async (userId: string): Promise<ApiResponse<AdAccount[]>> => {
    try {
      const response = await fetch(
        `/api/meta/ad-accounts?user_id=${encodeURIComponent(userId)}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[getAdAccounts]', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch ad accounts. Please try again.'
      };
    }
  },

  getPixels: async (
    userId: string,
    adAccountId: string
  ): Promise<ApiResponse<Pixel[]>> => {
    try {
      const response = await fetch(
        `/api/meta/pixels?user_id=${encodeURIComponent(userId)}&ad_account_id=${encodeURIComponent(adAccountId)}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[getPixels]', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch pixels. Please try again.'
      };
    }
  },

  getCatalogs: async (userId: string): Promise<ApiResponse<Catalog[]>> => {
    try {
      const response = await fetch(
        `/api/meta/catalogs?user_id=${encodeURIComponent(userId)}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[getCatalogs]', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch catalogs. Please try again.'
      };
    }
  },

  saveSelections: async (payload: {
    user_id: string;
    ad_account_id: string;
    ad_account_name: string;
    pixel_id: string;
    pixel_name: string;
    catalog_id?: string;
    catalog_name?: string;
  }): Promise<ApiResponse<{user_id: string; ad_account_id: string; pixel_id: string}>> => {
    try {
      const response = await fetch('/api/meta/save-selections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[saveSelections]', error);
      return {
        success: false,
        data: null,
        error: 'Failed to save selections. Please try again.'
      };
    }
  }
};
```

---

## 🔧 BACKEND IMPLEMENTATION (n8n)

### Overview

Create 4 n8n webhooks that:
1. Validate user identity
2. Fetch data from Supabase
3. Call Meta Graph API
4. Return JSON responses to frontend

**Common Setup for All Endpoints:**
- Use n8n HTTP Request nodes
- Set authentication headers
- Handle errors gracefully
- Log (but never expose tokens)
- Return JSON response

---

### Endpoint 1: Get Ad Accounts

**Webhook URL:** `https://n8n.srv1181726.hstgr.cloud/webhook-test/meta-ad-accounts`

**Method:** GET

**Query Parameters:**
- `user_id` (required) - UUID from frontend

**n8n Workflow Steps:**

```
1. Webhook Trigger
   - Accept GET requests
   - Extract query parameter: user_id

2. Supabase Query Node
   - Query: SELECT access_token, business_id
     FROM meta_account_selections
     WHERE user_id = {{user_id}}
   - Get first record
   - Store access_token and business_id

3. HTTP Request to Meta API
   - Method: GET
   - URL: https://graph.instagram.com/v19.0/me/adaccounts
   - Query Params:
     * fields: id,name,currency,account_status
     * access_token: {{access_token}}
   - Headers: Accept: application/json

4. Error Handler
   - If Supabase returns empty: Return error "No meta connection found"
   - If Meta API fails: Return error "Failed to fetch ad accounts"
   - If network timeout: Return error "Request timeout"

5. Response Mapping Node
   - Extract data.data array from Meta response
   - Map to: { id, name, currency }
   - Return JSON:
     {
       "success": true,
       "data": [...],
       "error": null
     }

6. Response Node
   - Set status: 200
   - Set headers: Content-Type: application/json
   - Return mapped response
```

**Sample Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "act_123456789",
      "name": "My Ad Account",
      "currency": "USD",
      "account_status": 1
    },
    {
      "id": "act_987654321",
      "name": "Another Account",
      "currency": "GBP",
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

**Webhook URL:** `https://n8n.srv1181726.hstgr.cloud/webhook-test/meta-pixels`

**Method:** GET

**Query Parameters:**
- `user_id` (required) - UUID from frontend
- `ad_account_id` (required) - Selected ad account ID

**n8n Workflow Steps:**

```
1. Webhook Trigger
   - Accept GET requests
   - Extract: user_id, ad_account_id

2. Supabase Query Node
   - Query: SELECT access_token FROM meta_account_selections
     WHERE user_id = {{user_id}}

3. HTTP Request to Meta API
   - Method: GET
   - URL: https://graph.instagram.com/v19.0/{{ad_account_id}}/owned_pixels
   - Query Params:
     * fields: id,name,creation_time
     * access_token: {{access_token}}

4. Error Handler
   - If no token found: Return error "Not authenticated"
   - If API fails: Return error "Failed to fetch pixels"

5. Response Mapping Node
   - Extract data.data array
   - Map to: { id, name, creation_time }
   - Return JSON with success flag

6. Response Node
   - Return mapped response
```

**Sample Response:**
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

---

### Endpoint 3: Get Catalogs

**Webhook URL:** `https://n8n.srv1181726.hstgr.cloud/webhook-test/meta-catalogs`

**Method:** GET

**Query Parameters:**
- `user_id` (required) - UUID from frontend

**n8n Workflow Steps:**

```
1. Webhook Trigger
   - Accept GET requests
   - Extract: user_id

2. Supabase Query Node
   - Query: SELECT access_token, business_id FROM meta_account_selections
     WHERE user_id = {{user_id}}

3. HTTP Request to Meta API
   - Method: GET
   - URL: https://graph.instagram.com/v19.0/{{business_id}}/owned_product_catalogs
   - Query Params:
     * fields: id,name,shop_name
     * access_token: {{access_token}}

4. Error Handler
   - If no token: Return error "Not authenticated"
   - If API fails (404 or auth error): Return empty data array
   - Catalogs are optional, so don't fail hard

5. Response Mapping Node
   - Extract data.data array (or return empty if not present)
   - Map to: { id, name, shop_name }

6. Response Node
   - Return mapped response
```

**Sample Response:**
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

**Empty Response (No Catalogs):**
```json
{
  "success": true,
  "data": [],
  "error": null
}
```

---

### Endpoint 4: Save Selections

**Webhook URL:** `https://n8n.srv1181726.hstgr.cloud/webhook-test/meta-save-selections`

**Method:** POST

**Request Body:**
```json
{
  "user_id": "uuid",
  "ad_account_id": "act_123456789",
  "ad_account_name": "My Ad Account",
  "pixel_id": "1234567890",
  "pixel_name": "My Pixel",
  "catalog_id": "optional_catalog_id",
  "catalog_name": "optional_catalog_name"
}
```

**n8n Workflow Steps:**

```
1. Webhook Trigger
   - Accept POST requests
   - Extract JSON body

2. Validation Node
   - Check: user_id exists
   - Check: ad_account_id exists
   - Check: pixel_id exists
   - If validation fails: Return error "Missing required fields"

3. Supabase Update Node
   - Query: UPDATE meta_account_selections SET
       ad_account_id = {{ad_account_id}},
       ad_account_name = {{ad_account_name}},
       pixel_id = {{pixel_id}},
       pixel_name = {{pixel_name}},
       catalog_id = {{catalog_id}},
       catalog_name = {{catalog_name}},
       selection_completed = true,
       connected_at = now(),
       updated_at = now()
     WHERE user_id = {{user_id}}

4. Error Handler
   - If update fails: Return error "Failed to save selections"
   - If no rows affected: Return error "User not found"

5. Response Node
   - Return success response with saved data
```

**Sample Success Response:**
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

## 🔐 SECURITY IMPLEMENTATION

### 1. Token Management

**Backend (n8n):**
- ✅ Access tokens stored encrypted in Supabase
- ✅ Tokens retrieved only server-side
- ✅ Never logged to console
- ✅ Never returned to frontend

**Frontend:**
- ❌ DO NOT store tokens
- ❌ DO NOT log tokens
- ❌ DO NOT send tokens to Meta API directly

### 2. User Verification

**Every n8n endpoint must:**

```typescript
// Step 1: Validate user_id parameter exists
if (!user_id) {
  return { success: false, error: "Missing user_id" };
}

// Step 2: Query Supabase for that user
const record = await supabase
  .from('meta_account_selections')
  .select('access_token')
  .eq('user_id', user_id)
  .single();

// Step 3: If no record, user not authenticated
if (!record) {
  return { success: false, error: "User not authenticated" };
}

// Step 4: Proceed with API call using stored token
```

### 3. CORS Configuration

**n8n Webhook Response Headers:**
```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: false
Content-Type: application/json
```

### 4. Rate Limiting (Optional but Recommended)

Implement in n8n or reverse proxy:
- Max 100 requests per user per minute
- Return 429 Too Many Requests if exceeded

### 5. Validation

**Frontend:**
- Validate user_id format (UUID)
- Validate selected IDs before submission
- Confirm required fields present

**Backend:**
- Validate all query parameters
- Validate POST body schema
- Check user ownership before updating

---

## 📊 DATABASE SCHEMA

### Table: `meta_account_selections`

```sql
CREATE TABLE IF NOT EXISTS meta_account_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  access_token TEXT NOT NULL,
  business_id TEXT,

  ad_account_id TEXT,
  ad_account_name TEXT,
  pixel_id TEXT,
  pixel_name TEXT,
  catalog_id TEXT,
  catalog_name TEXT,

  selection_completed BOOLEAN DEFAULT false,
  connected_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

ALTER TABLE meta_account_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own selections"
  ON meta_account_selections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own selections"
  ON meta_account_selections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## ✅ TESTING CHECKLIST

### Frontend Tests
- [ ] Page loads and fetches ad accounts
- [ ] Dropdown populates with accounts
- [ ] Can select account and proceed to Step 2
- [ ] Pixels dropdown loads for selected account
- [ ] Can select pixel and proceed to Step 3
- [ ] Catalogs optionally load
- [ ] Can skip catalog or select one
- [ ] Confirmation screen shows all selections
- [ ] Can go back and change selections
- [ ] Save button shows loading state
- [ ] Success message displays
- [ ] Redirects to dashboard on success
- [ ] Error banner shows on API failure
- [ ] Retry button works
- [ ] No tokens visible in console logs
- [ ] Works on mobile
- [ ] Proper error messages for each scenario

### Backend Tests
- [ ] GET /meta/ad-accounts returns accounts
- [ ] GET /meta/pixels returns pixels for account
- [ ] GET /meta/catalogs returns catalogs or empty
- [ ] POST /meta/save-selections saves data
- [ ] Invalid user_id returns error
- [ ] Missing parameters return error
- [ ] Database updates correctly
- [ ] No tokens returned in responses
- [ ] CORS headers present
- [ ] Rate limiting works (if implemented)
- [ ] Error responses properly formatted
- [ ] Handles network timeouts

### Security Tests
- [ ] Tokens not logged anywhere
- [ ] Tokens not returned to frontend
- [ ] User verification on all endpoints
- [ ] Unauthorized users get 401
- [ ] SQL injection prevention
- [ ] XSS prevention in data display
- [ ] HTTPS enforced
- [ ] CORS properly restricted

### Integration Tests
- [ ] Full flow: Ad Account → Pixel → Catalog → Save
- [ ] Redirect to dashboard works
- [ ] Dashboard detects connection
- [ ] Can reconnect/change selections
- [ ] Multiple users don't interfere

---

## 🚀 DEPLOYMENT

### Frontend
1. Build: `npm run build`
2. Deploy to hosting (Netlify, Vercel, etc.)
3. Update environment variables (API base URL)

### Backend (n8n)
1. Create 4 webhooks in n8n
2. Test each webhook manually
3. Document webhook URLs
4. Configure Supabase connection
5. Test with real Meta API calls
6. Set up monitoring/alerts

### Database (Supabase)
1. Create `meta_account_selections` table
2. Add RLS policies
3. Test data integrity
4. Verify constraints

---

## 📝 IMPLEMENTATION SUMMARY

**Frontend:**
- 1 page component: `/meta/select`
- 1 utility file: API calls
- ~400 lines of code
- 4-step user flow
- Full error handling

**Backend:**
- 4 n8n webhooks
- Supabase integration
- Meta API integration
- ~50 lines per webhook
- Complete validation

**Database:**
- 1 table with RLS
- Proper indexes
- Foreign key constraints
- User isolation

**Security:**
- No token exposure
- User verification
- CORS configured
- Validated inputs
- Proper error responses

**Testing:**
- 30+ test scenarios
- Security checklist
- Integration tests
- End-to-end flow

---

## 📞 API REFERENCE

### n8n Webhook Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/meta-ad-accounts` | GET | Fetch ad accounts for user |
| `/meta-pixels` | GET | Fetch pixels for ad account |
| `/meta-catalogs` | GET | Fetch catalogs for user |
| `/meta-save-selections` | POST | Save all selections to database |

### Frontend API Calls

```typescript
// All calls to n8n webhooks, never directly to Meta API
GET /api/meta/ad-accounts?user_id=...
GET /api/meta/pixels?user_id=...&ad_account_id=...
GET /api/meta/catalogs?user_id=...
POST /api/meta/save-selections (JSON body)
```

### Response Format

All successful responses:
```json
{
  "success": true,
  "data": [...],
  "error": null
}
```

All error responses:
```json
{
  "success": false,
  "data": null,
  "error": "Human-readable error message"
}
```

---

## 🎯 NEXT STEPS

1. **Frontend Development**
   - Build `/meta/select` component
   - Implement state management
   - Add error handling
   - Style with Tailwind CSS

2. **Backend Development**
   - Create 4 n8n webhooks
   - Configure Supabase queries
   - Test Meta API calls
   - Implement error handling

3. **Integration**
   - Connect frontend to backend
   - Update API URLs
   - Test end-to-end
   - Deploy

4. **Testing & QA**
   - Manual testing
   - Security review
   - Performance testing
   - Load testing

5. **Monitoring**
   - Set up error tracking
   - Monitor API performance
   - Track user conversions
   - Alert on failures

---

**This system is production-ready and follows industry best practices for OAuth integration, data security, and user experience.**
