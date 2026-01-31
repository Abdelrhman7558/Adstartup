# Meta Selection System - Implementation Roadmap

## 📋 Complete Implementation Guide

This document provides a step-by-step roadmap for implementing the complete Meta account selection system.

---

## PHASE 1: Database Setup (30 minutes)

### Step 1.1: Create Table

**File:** Supabase SQL Editor

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
  INDEX idx_selection_completed (selection_completed)
);
```

**✓ Verify:**
- Table created in Supabase
- Indexes created
- Columns match schema

### Step 1.2: Enable Row Level Security

```sql
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

**✓ Verify:**
- RLS enabled
- Policies created
- Test query returns user data only

---

## PHASE 2: Frontend Development (2-3 hours)

### Step 2.1: Create Utility File

**File:** `src/lib/metaSelectionApi.ts`

```typescript
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

const API_BASE = import.meta.env.VITE_API_BASE || '';

export const metaSelectionApi = {
  getAdAccounts: async (userId: string): Promise<ApiResponse<AdAccount[]>> => {
    try {
      const res = await fetch(
        `${API_BASE}/api/meta/ad-accounts?user_id=${encodeURIComponent(userId)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('[getAdAccounts]', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch ad accounts'
      };
    }
  },

  getPixels: async (
    userId: string,
    adAccountId: string
  ): Promise<ApiResponse<Pixel[]>> => {
    try {
      const res = await fetch(
        `${API_BASE}/api/meta/pixels?user_id=${encodeURIComponent(userId)}&ad_account_id=${encodeURIComponent(adAccountId)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('[getPixels]', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch pixels'
      };
    }
  },

  getCatalogs: async (userId: string): Promise<ApiResponse<Catalog[]>> => {
    try {
      const res = await fetch(
        `${API_BASE}/api/meta/catalogs?user_id=${encodeURIComponent(userId)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('[getCatalogs]', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch catalogs'
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
  }): Promise<ApiResponse<any>> => {
    try {
      const res = await fetch(`${API_BASE}/api/meta/save-selections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('[saveSelections]', error);
      return {
        success: false,
        data: null,
        error: 'Failed to save selections'
      };
    }
  }
};
```

**✓ Verify:**
- File created
- All functions exported
- No syntax errors

### Step 2.2: Create Main Page Component

**File:** `src/pages/MetaSelect.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { metaSelectionApi } from '../lib/metaSelectionApi';

export default function MetaSelect() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [step, setStep] = useState(1);
  const [selectedAdAccount, setSelectedAdAccount] = useState<string | null>(null);
  const [selectedPixel, setSelectedPixel] = useState<string | null>(null);
  const [selectedCatalog, setSelectedCatalog] = useState<string | null>(null);

  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [pixels, setPixels] = useState<any[]>([]);
  const [catalogs, setCatalogs] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch ad accounts on mount
  useEffect(() => {
    if (!user?.id) {
      navigate('/signin');
      return;
    }

    const fetchAccounts = async () => {
      setLoading(true);
      setError(null);
      const result = await metaSelectionApi.getAdAccounts(user.id);
      if (result.success && result.data) {
        setAdAccounts(result.data);
      } else {
        setError(result.error || 'Failed to load ad accounts');
      }
      setLoading(false);
    };

    fetchAccounts();
  }, [user, navigate]);

  // Fetch pixels when ad account selected
  const handleSelectAdAccount = async (accountId: string) => {
    setSelectedAdAccount(accountId);
    setLoading(true);
    setError(null);
    const result = await metaSelectionApi.getPixels(user!.id, accountId);
    if (result.success && result.data) {
      setPixels(result.data);
      setStep(2);
    } else {
      setError(result.error || 'Failed to load pixels');
    }
    setLoading(false);
  };

  // Fetch catalogs when pixel selected
  const handleSelectPixel = async (pixelId: string) => {
    setSelectedPixel(pixelId);
    setLoading(true);
    setError(null);
    const result = await metaSelectionApi.getCatalogs(user!.id);
    if (result.success) {
      setCatalogs(result.data || []);
      setStep(3);
    } else {
      setError(result.error || 'Failed to load catalogs');
      setCatalogs([]);
      setStep(3);
    }
    setLoading(false);
  };

  // Handle confirmation
  const handleConfirm = async () => {
    if (!selectedAdAccount || !selectedPixel) {
      setError('Please select ad account and pixel');
      return;
    }

    try {
      setSubmitting(true);
      const accountName = adAccounts.find(a => a.id === selectedAdAccount)?.name || '';
      const pixelName = pixels.find(p => p.id === selectedPixel)?.name || '';
      const catalogName = selectedCatalog
        ? catalogs.find(c => c.id === selectedCatalog)?.name || null
        : null;

      const result = await metaSelectionApi.saveSelections({
        user_id: user!.id,
        ad_account_id: selectedAdAccount,
        ad_account_name: accountName,
        pixel_id: selectedPixel,
        pixel_name: pixelName,
        catalog_id: selectedCatalog || undefined,
        catalog_name: catalogName || undefined,
      });

      if (result.success) {
        setStep(4);
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setError(result.error || 'Failed to save selections');
      }
    } catch (err: any) {
      setError('Error saving selections');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-4">Connect Your Meta Account</h1>
          <p className="text-gray-400 mb-6">Select your advertising assets</p>

          {/* Progress Bar */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-1 flex-1 rounded transition-colors ${
                  s <= step ? 'bg-red-600' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Step {step} of 4</p>
        </div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-600/20 border border-red-600/50 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400/60 hover:text-red-400 text-xs"
            >
              ✕
            </button>
          </motion.div>
        )}

        {/* Step 1: Ad Accounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-6 rounded-lg border transition-all ${
            step >= 1
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-gray-800/30 border-gray-800'
          }`}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="flex w-6 h-6 items-center justify-center rounded-full bg-red-600 text-xs">
              1
            </span>
            Select Ad Account
          </h2>

          {loading && step === 1 ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-10 bg-gray-700/50 rounded animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {adAccounts.map(account => (
                <button
                  key={account.id}
                  onClick={() => handleSelectAdAccount(account.id)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    selectedAdAccount === account.id
                      ? 'bg-red-600/20 border-red-600 text-white'
                      : 'bg-gray-700/30 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="font-medium">{account.name}</div>
                  <div className="text-xs mt-1 opacity-75">{account.currency}</div>
                </button>
              ))}
              {adAccounts.length === 0 && !loading && (
                <p className="text-gray-400 text-sm py-4">
                  No ad accounts found. Create one in Meta Business Suite.
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Step 2: Pixels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mb-6 p-6 rounded-lg border transition-all ${
            step >= 2
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-gray-800/30 border-gray-800'
          }`}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="flex w-6 h-6 items-center justify-center rounded-full bg-gray-700 text-xs">
              2
            </span>
            Select Pixel
          </h2>

          {step < 2 ? (
            <p className="text-gray-400 text-sm">Select an ad account first</p>
          ) : loading && step === 2 ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div
                  key={i}
                  className="h-10 bg-gray-700/50 rounded animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {pixels.map(pixel => (
                <button
                  key={pixel.id}
                  onClick={() => handleSelectPixel(pixel.id)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    selectedPixel === pixel.id
                      ? 'bg-red-600/20 border-red-600 text-white'
                      : 'bg-gray-700/30 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="font-medium">{pixel.name}</div>
                  <div className="text-xs mt-1 opacity-75">ID: {pixel.id}</div>
                </button>
              ))}
              {pixels.length === 0 && !loading && (
                <p className="text-gray-400 text-sm py-4">
                  No pixels found. Create one in Meta Business Suite.
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Step 3: Catalogs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mb-6 p-6 rounded-lg border transition-all ${
            step >= 3
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-gray-800/30 border-gray-800'
          }`}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="flex w-6 h-6 items-center justify-center rounded-full bg-gray-700 text-xs">
              3
            </span>
            Select Catalog (Optional)
          </h2>

          {step < 3 ? (
            <p className="text-gray-400 text-sm">Select a pixel first</p>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCatalog(null)}
                className={`w-full p-3 rounded-lg border transition-all text-left ${
                  selectedCatalog === null
                    ? 'bg-red-600/20 border-red-600 text-white'
                    : 'bg-gray-700/30 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                Skip catalog
              </button>
              {catalogs.map(catalog => (
                <button
                  key={catalog.id}
                  onClick={() => setSelectedCatalog(catalog.id)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    selectedCatalog === catalog.id
                      ? 'bg-red-600/20 border-red-600 text-white'
                      : 'bg-gray-700/30 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="font-medium">{catalog.name}</div>
                  {catalog.shop_name && (
                    <div className="text-xs mt-1 opacity-75">{catalog.shop_name}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Step 4: Confirmation */}
        {step >= 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-6 rounded-lg bg-green-600/10 border border-green-600/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h2 className="text-lg font-semibold">Selections Saved!</h2>
            </div>
            <p className="text-gray-300 text-sm">
              Your Meta account has been connected. Redirecting to dashboard...
            </p>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        {step < 4 && (
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            )}
            {step < 3 && (
              <button
                onClick={() => {
                  if (step === 1 && selectedAdAccount) {
                    handleSelectAdAccount(selectedAdAccount);
                  } else if (step === 2 && selectedPixel) {
                    handleSelectPixel(selectedPixel);
                  }
                }}
                disabled={
                  (step === 1 && !selectedAdAccount) ||
                  (step === 2 && !selectedPixel) ||
                  loading
                }
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors font-semibold"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleConfirm}
                disabled={!selectedPixel || submitting}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors font-semibold"
              >
                {submitting ? 'Saving...' : 'Confirm & Finish'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

**✓ Verify:**
- Component renders without errors
- All buttons functional
- States update correctly

---

## PHASE 3: Backend Setup (n8n) (1-2 hours)

### Step 3.1: Create Ad Accounts Endpoint

**In n8n:**

1. Create new workflow
2. Add Webhook trigger (GET)
3. Add Supabase node: Get access token
4. Add HTTP node: Call Meta API
5. Add Response node

**Webhook configuration:**
- URL: `/meta-ad-accounts`
- Method: GET
- Accept query: `user_id`

**Test:**
```bash
curl "your-n8n-domain/webhook/meta-ad-accounts?user_id=test-uuid"
```

### Step 3.2: Create Pixels Endpoint

**In n8n:**

1. Create new workflow
2. Add Webhook trigger (GET)
3. Add Supabase node: Get access token
4. Add HTTP node: Call Meta API with ad_account_id
5. Add Response node

**Test:**
```bash
curl "your-n8n-domain/webhook/meta-pixels?user_id=test-uuid&ad_account_id=act_123"
```

### Step 3.3: Create Catalogs Endpoint

**In n8n:**

1. Create new workflow
2. Add Webhook trigger (GET)
3. Add Supabase node: Get access token and business_id
4. Add HTTP node: Call Meta API
5. Add Response node

### Step 3.4: Create Save Selections Endpoint

**In n8n:**

1. Create new workflow
2. Add Webhook trigger (POST)
3. Add Validation node: Check required fields
4. Add Supabase node: Update meta_account_selections
5. Add Response node

**Test:**
```bash
curl -X POST "your-n8n-domain/webhook/meta-save-selections" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-uuid",
    "ad_account_id": "act_123",
    "ad_account_name": "Account",
    "pixel_id": "456",
    "pixel_name": "Pixel"
  }'
```

---

## PHASE 4: Integration (1 hour)

### Step 4.1: Update Environment Variables

**File:** `.env`

```
VITE_API_BASE=https://your-n8n-domain
```

**In frontend API calls:**
```typescript
const API_BASE = import.meta.env.VITE_API_BASE || '';
```

### Step 4.2: Add Route

**File:** `src/App.tsx`

```typescript
import MetaSelect from './pages/MetaSelect';

// In routes array:
{
  path: '/meta/select',
  element: <ProtectedRoute><MetaSelect /></ProtectedRoute>
}
```

### Step 4.3: Update Dashboard

Ensure dashboard checks for connection status and shows appropriate message:

```typescript
const metaConnected = profile?.meta_account_id;

if (!metaConnected) {
  return (
    // Show "Connect Meta Account" prompt
  );
}
```

---

## PHASE 5: Testing (1-2 hours)

### Unit Tests

- [ ] metaSelectionApi.getAdAccounts() returns correct format
- [ ] metaSelectionApi.getPixels() returns correct format
- [ ] metaSelectionApi.getCatalogs() returns correct format
- [ ] metaSelectionApi.saveSelections() sends correct payload

### Component Tests

- [ ] MetaSelect renders at step 1
- [ ] Ad accounts dropdown populates
- [ ] Can select ad account and proceed
- [ ] Pixels dropdown populates after selection
- [ ] Can select pixel and proceed
- [ ] Catalogs load and can be skipped
- [ ] Confirmation shows selected items
- [ ] Save button disables during submission
- [ ] Error banner displays on failure
- [ ] Redirect to dashboard on success

### Integration Tests

- [ ] Full flow: Account → Pixel → Catalog → Save
- [ ] Error handling at each step
- [ ] Network failure recovery
- [ ] Missing parameter handling
- [ ] Database updates correctly
- [ ] Dashboard reflects changes

### Security Tests

- [ ] No tokens in localStorage
- [ ] No tokens in console logs
- [ ] No tokens in API responses
- [ ] User verification works
- [ ] Unauthorized access blocked
- [ ] SQL injection protected

---

## PHASE 6: Deployment (30 minutes)

### Step 6.1: Build & Test

```bash
npm run build
npm run preview
```

**Verify:**
- Build succeeds
- No errors in console
- All features work

### Step 6.2: Deploy Frontend

```bash
# Your deployment command
# (Netlify, Vercel, etc.)
```

### Step 6.3: Deploy Backend

- Ensure n8n workflows are active
- Test endpoints from production
- Verify Supabase connections

### Step 6.4: Smoke Tests

- [ ] OAuth flow works
- [ ] MetaSelect page loads
- [ ] All dropdowns populate
- [ ] Save to database works
- [ ] Dashboard shows connected status

---

## 🚀 Success Criteria

✅ All 4 steps working
✅ Data saves to database
✅ Dashboard shows connected status
✅ No tokens exposed
✅ Error handling graceful
✅ Mobile responsive
✅ Load times < 2 seconds
✅ 0 console errors

---

## 📊 Architecture Summary

```
User Flow:
  OAuth → MetaSelect (Step 1) → MetaSelect (Step 2)
    → MetaSelect (Step 3) → MetaSelect (Confirm)
    → Save via n8n → Database Update → Dashboard

API Flow:
  Frontend → n8n Webhook → Supabase (get token)
    → Meta Graph API → Format Response → Return to Frontend
```

---

## 🔧 File Structure

```
src/
├── pages/
│   └── MetaSelect.tsx          (Main component)
├── lib/
│   └── metaSelectionApi.ts     (API calls)
├── components/
│   └── (existing components)
└── App.tsx                      (Add route)

Backend (n8n):
├── meta-ad-accounts             (GET webhook)
├── meta-pixels                  (GET webhook)
├── meta-catalogs                (GET webhook)
└── meta-save-selections         (POST webhook)

Database (Supabase):
└── meta_account_selections      (Table)
```

---

## 📝 Quick Checklist

### Before Implementation
- [ ] Supabase account ready
- [ ] n8n instance ready
- [ ] Meta API credentials ready
- [ ] Access tokens stored in database

### During Implementation
- [ ] Database table created
- [ ] RLS policies set
- [ ] Frontend component built
- [ ] API utility functions created
- [ ] n8n webhooks created
- [ ] Integration tested

### After Implementation
- [ ] All tests passed
- [ ] Security verified
- [ ] Performance checked
- [ ] Documentation updated
- [ ] Team trained
- [ ] Monitoring set up

---

## 📞 Troubleshooting

### Issue: "No meta connection found"
**Solution:** Verify user has completed OAuth and token is stored

### Issue: "Failed to fetch ad accounts"
**Solution:** Check Meta API credentials, verify access_token valid

### Issue: Pixels not loading
**Solution:** Ensure ad account ID is correct, check Meta API response

### Issue: Save fails
**Solution:** Verify Supabase connection, check for RLS policy issues

### Issue: Tokens visible in console
**Solution:** Search for `access_token` in code, remove any logging

---

## 📚 Documentation Files

- `META_SELECTION_SYSTEM.md` - Complete system overview
- `BOLT_PROMPT_META_SELECTION.md` - Detailed implementation guide
- `META_API_QUICK_REFERENCE.md` - Quick lookup guide
- `META_IMPLEMENTATION_ROADMAP.md` - This file

---

## 🎯 Next Steps

1. **Start with Phase 1** - Set up database
2. **Move to Phase 2** - Build frontend
3. **Implement Phase 3** - Create n8n webhooks
4. **Complete Phase 4** - Integrate everything
5. **Execute Phase 5** - Thorough testing
6. **Deploy Phase 6** - Go live

---

**Status:** Ready for Implementation
**Last Updated:** 2024-12-20
**Version:** 1.0
**Estimated Time:** 5-7 hours for complete implementation
