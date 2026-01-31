# Meta Selection System - Quick Reference Guide

## 🎯 Quick Start

### Frontend Flow
1. User lands on `/meta/select` after OAuth
2. Component loads and fetches ad accounts via n8n
3. User selects ad account → fetches pixels
4. User selects pixel → fetches catalogs
5. User optionally selects catalog
6. User confirms all selections
7. Frontend sends to n8n to save
8. Redirect to dashboard

### Backend Flow
```
Frontend Request → n8n Webhook → Query Supabase for Token
    → Call Meta Graph API → Format Response → Return JSON
```

---

## 🔌 API Endpoints Quick Reference

### 1. Get Ad Accounts
```
GET /api/meta/ad-accounts?user_id={{USER_ID}}

RESPONSE:
{
  "success": true,
  "data": [
    {"id": "act_123", "name": "My Account", "currency": "USD"}
  ],
  "error": null
}
```

### 2. Get Pixels
```
GET /api/meta/pixels?user_id={{USER_ID}}&ad_account_id={{ACCOUNT_ID}}

RESPONSE:
{
  "success": true,
  "data": [
    {"id": "1234567890", "name": "My Pixel"}
  ],
  "error": null
}
```

### 3. Get Catalogs
```
GET /api/meta/catalogs?user_id={{USER_ID}}

RESPONSE:
{
  "success": true,
  "data": [
    {"id": "123", "name": "My Catalog", "shop_name": "My Shop"}
  ],
  "error": null
}
```

### 4. Save Selections
```
POST /api/meta/save-selections

BODY:
{
  "user_id": "uuid",
  "ad_account_id": "act_123",
  "ad_account_name": "My Account",
  "pixel_id": "1234567890",
  "pixel_name": "My Pixel",
  "catalog_id": "123" (optional)
}

RESPONSE:
{
  "success": true,
  "message": "Saved successfully",
  "data": {...}
}
```

---

## 📋 Meta Graph API Endpoints

### Ad Accounts
```
GET https://graph.instagram.com/v19.0/me/adaccounts
  ?fields=id,name,currency,account_status
  &access_token={{TOKEN}}
```

### Pixels
```
GET https://graph.instagram.com/v19.0/{AD_ACCOUNT_ID}/owned_pixels
  ?fields=id,name,creation_time
  &access_token={{TOKEN}}
```

### Catalogs
```
GET https://graph.instagram.com/v19.0/{BUSINESS_ID}/owned_product_catalogs
  ?fields=id,name,shop_name
  &access_token={{TOKEN}}
```

---

## 🛠️ Frontend Component Template

```typescript
// src/pages/MetaSelect.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function MetaSelect() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  // Step 1: Fetch Ad Accounts
  useEffect(() => {
    if (!user?.id) return;

    const fetchAdAccounts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/meta/ad-accounts?user_id=${user.id}`);
        const data = await res.json();
        if (data.success) {
          setAdAccounts(data.data);
        } else {
          setError(data.error || 'Failed to load ad accounts');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdAccounts();
  }, [user]);

  // Step 2: Fetch Pixels when ad account selected
  useEffect(() => {
    if (!selectedAdAccount) return;

    const fetchPixels = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/meta/pixels?user_id=${user?.id}&ad_account_id=${selectedAdAccount}`
        );
        const data = await res.json();
        if (data.success) {
          setPixels(data.data);
          setStep(2);
        } else {
          setError(data.error || 'Failed to load pixels');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPixels();
  }, [selectedAdAccount]);

  // Step 3: Fetch Catalogs when pixel selected
  useEffect(() => {
    if (!selectedPixel || step !== 2) return;

    const fetchCatalogs = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/meta/catalogs?user_id=${user?.id}`);
        const data = await res.json();
        if (data.success) {
          setCatalogs(data.data);
          setStep(3);
        } else {
          setError(data.error || 'Failed to load catalogs');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogs();
  }, [selectedPixel]);

  // Handle confirmation
  const handleConfirm = async () => {
    if (!selectedAdAccount || !selectedPixel) {
      setError('Please select ad account and pixel');
      return;
    }

    try {
      setSubmitting(true);
      const adAccountName = adAccounts.find(a => a.id === selectedAdAccount)?.name;
      const pixelName = pixels.find(p => p.id === selectedPixel)?.name;
      const catalogName = selectedCatalog
        ? catalogs.find(c => c.id === selectedCatalog)?.name
        : null;

      const res = await fetch('/api/meta/save-selections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          ad_account_id: selectedAdAccount,
          ad_account_name: adAccountName,
          pixel_id: selectedPixel,
          pixel_name: pixelName,
          catalog_id: selectedCatalog || null,
          catalog_name: catalogName || null,
        })
      });

      const data = await res.json();
      if (data.success) {
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setError(data.error || 'Failed to save selections');
      }
    } catch (err) {
      setError('Error saving selections. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`flex-1 h-2 mx-1 rounded ${
                  s <= step ? 'bg-red-600' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-400">Step {step} of 4</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-600/20 border border-red-600 rounded text-red-400">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Step 1: Ad Accounts */}
        {step >= 1 && (
          <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Step 1: Select Ad Account</h2>
            {loading ? (
              <div className="animate-pulse h-10 bg-gray-700 rounded" />
            ) : (
              <select
                value={selectedAdAccount || ''}
                onChange={(e) => setSelectedAdAccount(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              >
                <option value="">Choose ad account...</option>
                {adAccounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Step 2: Pixels */}
        {step >= 2 && (
          <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Step 2: Select Pixel</h2>
            {loading ? (
              <div className="animate-pulse h-10 bg-gray-700 rounded" />
            ) : (
              <select
                value={selectedPixel || ''}
                onChange={(e) => setSelectedPixel(e.target.value)}
                disabled={!selectedAdAccount}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white disabled:opacity-50"
              >
                <option value="">Choose pixel...</option>
                {pixels.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Step 3: Catalogs */}
        {step >= 3 && (
          <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Step 3: Select Catalog (Optional)</h2>
            {loading ? (
              <div className="animate-pulse h-10 bg-gray-700 rounded" />
            ) : (
              <select
                value={selectedCatalog || ''}
                onChange={(e) => setSelectedCatalog(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              >
                <option value="">Skip catalog</option>
                {catalogs.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step >= 4 && (
          <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Step 4: Review Selections</h2>
            <div className="space-y-2 mb-6 text-sm text-gray-300">
              <p>✓ Account: {adAccounts.find(a => a.id === selectedAdAccount)?.name}</p>
              <p>✓ Pixel: {pixels.find(p => p.id === selectedPixel)?.name}</p>
              <p>✓ Catalog: {selectedCatalog ? catalogs.find(c => c.id === selectedCatalog)?.name : 'Not selected'}</p>
            </div>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded font-semibold"
            >
              {submitting ? 'Saving...' : 'Confirm & Finish'}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded"
            >
              ← Previous
            </button>
          )}
          {step < 4 && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !selectedAdAccount) ||
                (step === 2 && !selectedPixel)
              }
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 🔧 n8n Webhook Setup - Quick Steps

### For Each Endpoint (Repeat 4 times)

1. **Create Webhook Trigger**
   - Choose GET or POST
   - Set method
   - Copy webhook URL

2. **Add Supabase Node**
   - Configure connection
   - Write query to get token
   - Extract access_token

3. **Add Meta API Call**
   - HTTP Request node
   - Set URL
   - Add query parameters
   - Use access_token from step 2

4. **Add Error Handling**
   - Catch errors from Meta API
   - Return error response

5. **Add Response Node**
   - Format JSON
   - Set status 200
   - Return to frontend

---

## 🗄️ Supabase Query Examples

### Get Access Token
```sql
SELECT access_token, business_id
FROM meta_account_selections
WHERE user_id = '{{user_id}}'
LIMIT 1
```

### Save Selections
```sql
UPDATE meta_account_selections
SET
  ad_account_id = '{{ad_account_id}}',
  ad_account_name = '{{ad_account_name}}',
  pixel_id = '{{pixel_id}}',
  pixel_name = '{{pixel_name}}',
  catalog_id = {{catalog_id}},
  selection_completed = true,
  connected_at = now(),
  updated_at = now()
WHERE user_id = '{{user_id}}'
```

---

## 🚨 Common Error Messages

| Scenario | Error | Solution |
|----------|-------|----------|
| User has no meta connection | "No meta connection found" | User must complete OAuth first |
| No ad accounts | "No ad accounts found" | Create account in Meta Business Suite |
| No pixels | "No pixels found" | Create pixel in Meta Business Suite |
| Invalid token | "Unauthorized" | Reconnect Meta account |
| Network timeout | "Request timeout" | Check connection, retry |
| Missing parameter | "Missing required field" | Verify all parameters sent |

---

## 🔐 Security Checklist

- [ ] No tokens in frontend code
- [ ] No tokens in console logs
- [ ] All Meta API calls server-side
- [ ] User verification on all endpoints
- [ ] Request validation
- [ ] Error messages don't expose internals
- [ ] HTTPS enforced
- [ ] CORS properly configured

---

## 📱 Mobile Responsive Tips

- Full-width selects/buttons
- Readable font sizes (16px minimum)
- Touch-friendly button sizes (48px)
- Stack elements vertically
- Mobile-first CSS approach
- Test on devices

---

## 🧪 Quick Testing

### Test Ad Account Fetch
```bash
curl "https://your-domain/api/meta/ad-accounts?user_id=test-uuid"
```

### Test Pixel Fetch
```bash
curl "https://your-domain/api/meta/pixels?user_id=test-uuid&ad_account_id=act_123"
```

### Test Save
```bash
curl -X POST "https://your-domain/api/meta/save-selections" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-uuid",
    "ad_account_id": "act_123",
    "pixel_id": "456"
  }'
```

---

## 📊 Database Schema Quick Reference

```sql
CREATE TABLE meta_account_selections (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
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
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔗 Useful Links

- **Meta Graph API Docs**: https://developers.facebook.com/docs/graph-api
- **Ad Accounts Reference**: https://developers.facebook.com/docs/marketing-api/reference/ad-account
- **Owned Pixels**: https://developers.facebook.com/docs/marketing-api/reference/owned-pixel
- **Product Catalogs**: https://developers.facebook.com/docs/marketing-api/reference/business-owned-product-catalog
- **n8n Webhook Docs**: https://docs.n8n.io/workflows/triggers/builtin/
- **Supabase Docs**: https://supabase.com/docs

---

## 💡 Pro Tips

1. **Test with curl first** before building frontend
2. **Use Postman** to test n8n endpoints
3. **Check n8n logs** for API response details
4. **Enable RLS** on Supabase for security
5. **Cache ad accounts** on frontend (they rarely change)
6. **Handle network errors** gracefully
7. **Add loading states** for all async operations
8. **Log errors** (not tokens!) for debugging
9. **Test on real Meta API** before deploying
10. **Document all endpoints** for team reference

---

**Last Updated:** 2024-12-20
**Status:** Production-Ready
**Version:** 1.0
