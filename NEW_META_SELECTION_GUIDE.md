# Complete Meta Selection System - Production Guide

## 🎯 Overview

This is a **complete, production-ready Meta account selection system** similar to Shopify's integration. Users select their Ad Account, Pixel, and optionally a Product Catalog through a beautiful, step-by-step guided interface.

## ✅ What's Included

### Frontend
- **Page**: `/meta-select` (or `/meta/select`)
- **4-Step Selection Flow**:
  1. Select Ad Account
  2. Select Pixel (filtered by Ad Account)
  3. Select Product Catalog (optional)
  4. Confirmation Screen
- **Features**:
  - Progress indicator
  - Loading states with spinners
  - Error handling with clear messages
  - Success confirmation
  - Auto-redirect to dashboard
  - Dark theme with red accents
  - Fully responsive

### Backend (Supabase Edge Functions)
- **`get-ad-accounts`**: Fetches user's Meta Ad Accounts
- **`get-pixels`**: Fetches Pixels for selected Ad Account
- **`get-catalogs`**: Fetches Product Catalogs
- **`save-meta-selections`**: Saves selections and triggers webhook

### Security
- ✅ Access tokens NEVER exposed to frontend
- ✅ All Meta API calls are server-side
- ✅ JWT authentication on all endpoints
- ✅ RLS policies protect data
- ✅ User verification on every request

## 📁 File Structure

```
project/
├── src/
│   └── pages/
│       └── MetaSelect.tsx          # Main selection page (NEW)
├── supabase/
│   └── functions/
│       ├── get-ad-accounts/        # Fetch Ad Accounts
│       ├── get-pixels/             # Fetch Pixels
│       ├── get-catalogs/           # Fetch Catalogs
│       └── save-meta-selections/   # Save selections
└── supabase/
    └── migrations/
        └── [timestamps]_...        # Database schema
```

## 🚀 How It Works

### User Flow

1. **User navigates to `/meta-select?user_id=xxx`** (or without user_id if logged in)
2. **Step 1: Select Ad Account**
   - Page fetches Ad Accounts via Edge Function
   - User selects an account
   - Clicks "Next"
3. **Step 2: Select Pixel**
   - Page fetches Pixels for selected Ad Account
   - User selects a pixel
   - Clicks "Next"
4. **Step 3: Select Catalog (Optional)**
   - Page fetches Product Catalogs
   - User can select a catalog or skip
   - Clicks "Next"
5. **Step 4: Confirmation**
   - User reviews all selections
   - Clicks "Confirm & Finish"
   - Data saved to database
   - Webhook triggered to n8n
   - Auto-redirect to `/dashboard` after 2 seconds

### Data Flow

```
┌─────────────┐
│   Frontend  │
│ /meta-select│
└──────┬──────┘
       │
       │ 1. GET /functions/v1/get-ad-accounts
       │
┌──────▼──────────────────────────────────────┐
│  Supabase Edge Function                     │
│  - Validates JWT                            │
│  - Fetches access_token from database       │
│  - Calls Meta Graph API (server-side)      │
│  - Returns JSON to frontend                 │
└──────┬──────────────────────────────────────┘
       │
       │ 2. Meta Graph API Response
       │
┌──────▼──────┐
│   Frontend  │
│   Displays  │
│  Dropdown   │
└─────────────┘
```

## 🎨 UI Features

### Step-by-Step Design

**Step 1: Ad Account Selection**
```
┌─────────────────────────────────────────┐
│  Meta Account Setup                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Step 1 of 4                            │
│                                         │
│  Select Ad Account                      │
│  Choose the Ad Account you want to use │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ ✓ My Ad Account        Currency   │ │ <- Selected
│  │   act_123456789                   │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │   Another Account      Currency   │ │
│  │   act_987654321                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Previous]                     [Next] │
└─────────────────────────────────────────┘
```

**Loading State**
```
┌─────────────────────────────────────────┐
│           ⟳ Spinner                     │
│      Loading Ad Accounts...             │
└─────────────────────────────────────────┘
```

**Error State**
```
┌─────────────────────────────────────────┐
│  ⚠ Error                                │
│  Failed to fetch ad accounts            │
└─────────────────────────────────────────┘
```

**Step 4: Confirmation**
```
┌─────────────────────────────────────────┐
│  Confirm Your Selections                │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ AD ACCOUNT                        │ │
│  │ My Ad Account                     │ │
│  │ act_123456789                     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ PIXEL                             │ │
│  │ My Pixel                          │ │
│  │ 123456789                         │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ PRODUCT CATALOG                   │ │
│  │ None (Skipped)                    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Previous]      [✓ Confirm & Finish] │
└─────────────────────────────────────────┘
```

## 🔧 Backend API

### Edge Function Endpoints

All endpoints are deployed as Supabase Edge Functions and are already live:

#### 1. Get Ad Accounts
- **URL**: `https://[YOUR_SUPABASE_URL]/functions/v1/get-ad-accounts`
- **Method**: GET
- **Auth**: JWT Bearer Token (required)
- **Response**:
```json
{
  "data": [
    {
      "id": "act_123456789",
      "name": "My Ad Account",
      "currency": "USD",
      "account_status": 1
    }
  ]
}
```

#### 2. Get Pixels
- **URL**: `https://[YOUR_SUPABASE_URL]/functions/v1/get-pixels?ad_account_id=act_xxx`
- **Method**: GET
- **Auth**: JWT Bearer Token (required)
- **Query Params**: `ad_account_id` (required)
- **Response**:
```json
{
  "data": [
    {
      "id": "123456789",
      "name": "My Pixel",
      "last_fired_time": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 3. Get Catalogs
- **URL**: `https://[YOUR_SUPABASE_URL]/functions/v1/get-catalogs`
- **Method**: GET
- **Auth**: JWT Bearer Token (required)
- **Response**:
```json
{
  "data": [
    {
      "id": "123456789",
      "name": "My Catalog",
      "product_count": 150
    }
  ]
}
```

#### 4. Save Meta Selections
- **URL**: `https://[YOUR_SUPABASE_URL]/functions/v1/save-meta-selections`
- **Method**: POST
- **Auth**: JWT Bearer Token (required)
- **Body**:
```json
{
  "brief_id": "uuid-optional",
  "ad_account_id": "act_123456789",
  "ad_account_name": "My Ad Account",
  "pixel_id": "123456789",
  "pixel_name": "My Pixel",
  "catalog_id": "123456789",
  "catalog_name": "My Catalog"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "ad_account_id": "act_123456789",
    "pixel_id": "123456789"
  }
}
```

**Additional Actions**:
- Saves to `meta_account_selections` table
- Fetches brief data if `brief_id` provided
- Sends webhook to n8n with all data
- Updates webhook status in database

## 🗄️ Database Schema

### `meta_connections`
Stores Meta OAuth connection details (access tokens)

```sql
CREATE TABLE meta_connections (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  access_token text,  -- NEVER exposed to frontend
  ad_account_id text,
  pixel_id text,
  catalog_id text,
  is_connected boolean DEFAULT false,
  connected_at timestamptz,
  updated_at timestamptz,
  created_at timestamptz
);
```

### `meta_account_selections`
Stores user's selected Meta accounts

```sql
CREATE TABLE meta_account_selections (
  id uuid PRIMARY KEY,
  user_id uuid UNIQUE REFERENCES auth.users(id),
  brief_id uuid REFERENCES client_briefs(id),
  ad_account_id text NOT NULL,
  ad_account_name text,
  pixel_id text,
  pixel_name text,
  catalog_id text,
  catalog_name text,
  selection_completed boolean DEFAULT false,
  webhook_submitted boolean DEFAULT false,
  webhook_response jsonb DEFAULT '{}',
  created_at timestamptz,
  updated_at timestamptz
);
```

## 🔐 Security Features

### 1. No Token Exposure
- Access tokens stored in `meta_connections` table
- NEVER selected or returned to frontend
- All Meta API calls happen server-side in Edge Functions

### 2. JWT Authentication
- All Edge Functions validate JWT tokens
- User identity verified on every request
- Session required for all operations

### 3. RLS Policies
- Users can only access their own data
- Row Level Security enforced on all tables
- `auth.uid()` used for user verification

### 4. Input Validation
- All parameters validated before processing
- SQL injection prevention via parameterized queries
- Error messages don't expose sensitive data

## 📊 Testing Guide

### Manual Testing

1. **Test Authentication**
   ```bash
   # Navigate to /meta-select without login
   # Expected: Redirect to /signin
   ```

2. **Test Ad Account Selection**
   ```bash
   # Login and navigate to /meta-select
   # Expected: See list of Ad Accounts
   # Action: Select one, click Next
   ```

3. **Test Pixel Selection**
   ```bash
   # After selecting Ad Account
   # Expected: See Pixels for that account
   # Action: Select one, click Next
   ```

4. **Test Catalog Selection**
   ```bash
   # After selecting Pixel
   # Expected: See Catalogs or "Skip" option
   # Action: Select catalog or skip, click Next
   ```

5. **Test Confirmation**
   ```bash
   # Review all selections
   # Action: Click "Confirm & Finish"
   # Expected: Success message, redirect to /dashboard
   ```

### Error Scenarios

**No Ad Accounts**
- Message: "No Ad Accounts found. Please make sure you have at least one Ad Account in your Meta Business Manager."

**No Pixels**
- Message: "No Pixels found for this Ad Account. You can create a pixel in your Meta Events Manager."

**No Meta Connection**
- Message: "No Meta connection found"
- Action: User should complete OAuth flow first

**API Failure**
- Message: "Failed to fetch [resource]. Please try again."
- Action: User can retry

## 🔌 n8n Webhook Integration

The save endpoint sends a webhook to n8n with this payload:

**Webhook URL**: `https://n8n.srv1181726.hstgr.cloud/webhook-test/Collect-All-Account`

**Payload**:
```json
{
  "user_id": "uuid",
  "brief_id": "uuid",
  "ad_account_id": "act_123456789",
  "ad_account_name": "My Ad Account",
  "pixel_id": "123456789",
  "pixel_name": "My Pixel",
  "catalog_id": "123456789",
  "catalog_name": "My Catalog",
  "brief_data": {
    "id": "uuid",
    "business_name": "My Business",
    "product_description": "...",
    "target_country": "US",
    "monthly_budget": "5000",
    "goal": "conversions"
  }
}
```

## 🎯 Alternative: Using n8n Instead of Edge Functions

If you prefer to use n8n webhooks instead of Supabase Edge Functions, here's how:

### n8n Webhook Setup

Create 4 webhooks in n8n:

1. **Get Ad Accounts**: `https://n8n.example.com/webhook/meta-ad-accounts`
2. **Get Pixels**: `https://n8n.example.com/webhook/meta-pixels`
3. **Get Catalogs**: `https://n8n.example.com/webhook/meta-catalogs`
4. **Save Selections**: `https://n8n.example.com/webhook/meta-save`

### Update Frontend

In `MetaSelect.tsx`, change the API URLs:

```typescript
// Instead of:
const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-ad-accounts`;

// Use:
const apiUrl = 'https://n8n.example.com/webhook/meta-ad-accounts?user_id=' + userId;
```

### n8n Workflow Pattern

Each n8n webhook should:
1. Accept HTTP request (GET or POST)
2. Extract `user_id` from query or body
3. Query Supabase for `access_token`:
   ```sql
   SELECT access_token FROM meta_connections WHERE user_id = {{user_id}}
   ```
4. Call Meta Graph API with access_token
5. Return JSON response to frontend

**Example n8n Flow for Get Ad Accounts**:
```
Webhook → Supabase Query → HTTP Request (Meta API) → Response
```

## 🚀 Deployment Checklist

- [x] Edge Functions deployed
- [x] Database migrations applied
- [x] RLS policies configured
- [x] Frontend built successfully
- [x] Routing configured
- [x] Error handling implemented
- [x] Security verified
- [x] Webhook integration tested

## 📱 Responsive Design

The page is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1024px - 1920px)
- Tablet (768px - 1024px)
- Mobile (375px - 768px)

## 🎨 Theme

- **Background**: Dark gradient (slate-900 to slate-800)
- **Accent Color**: Red (#dc2626)
- **Cards**: Slate-800 with slate-700 borders
- **Text**: White for headings, slate-400 for descriptions
- **Hover States**: Red-500/50 border color
- **Selected State**: Red-600 border with red-600/10 background

## 🔄 State Management

The page uses React hooks for state:
- `currentStep`: Current step (1-4)
- `loading`: Loading state for API calls
- `error`: Error message
- `submitting`: Submission in progress
- `adAccounts`, `pixels`, `catalogs`: Data arrays
- `selectedAdAccount`, `selectedPixel`, `selectedCatalog`: Selected IDs

## 📈 Next Steps

1. **Monitor Performance**: Check Edge Function logs
2. **Track Conversions**: How many users complete the flow
3. **Optimize UX**: Gather user feedback
4. **Add Analytics**: Track step drop-offs
5. **A/B Testing**: Test different copy and layouts

## 💡 Tips

- **Empty States**: Always show helpful messages when lists are empty
- **Loading States**: Show spinners during API calls
- **Error Recovery**: Allow users to retry on errors
- **Progress Indicators**: Show step progress clearly
- **Confirmation**: Always let users review before submitting
- **Success Feedback**: Confirm action completion before redirect

---

## 📞 Support

If you encounter issues:

1. Check Edge Function logs in Supabase Dashboard
2. Verify Meta connection exists in database
3. Check browser console for frontend errors
4. Verify webhook is receiving data in n8n
5. Check RLS policies are configured correctly

---

**Status**: ✅ Production Ready

**Last Updated**: 2025-12-21

**Version**: 2.0 (Complete Rewrite)
