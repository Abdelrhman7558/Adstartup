# Simple Dashboard - Webhook Only

## Overview

The dashboard is now a **pure data renderer**. It:

- Fetches data from ONE webhook endpoint
- Displays data exactly as received
- Makes NO calculations, transformations, or inferences
- Makes NO network calls beyond the single webhook request

---

## How It Works

### 1. When Dashboard Loads

```
User navigates to dashboard
↓
Dashboard component loads
↓
User ID extracted from authenticated session
↓
Single POST request sent to webhook
↓
Response data displayed immediately
```

### 2. Webhook Request

**Endpoint:** `POST https://n8n.srv1181726.hstgr.cloud/webhook-test/other-data`

**Request Body:**
```json
{
  "user_id": "<logged-in-user-id>"
}
```

**Headers:**
```
Content-Type: application/json
```

### 3. Expected Response Structure

```typescript
{
  "top_5_campaigns": [
    {
      "id": "string",
      "name": "string",
      "spend": number,
      "revenue": number,
      "roas": number,
      "status": "string"
    }
  ],
  "sales_trend": [
    {
      "date": "YYYY-MM-DD",
      "sales": number
    }
  ],
  "recent_campaigns": [
    {
      "id": "string",
      "name": "string",
      "status": "string",
      "created_at": "ISO-8601"
    }
  ],
  "ads": [
    {
      "id": "string",
      "name": "string",
      "status": "string",
      "impressions": number,
      "clicks": number,
      "spend": number
    }
  ]
}
```

### 4. Display Behavior

- If `top_5_campaigns` array exists → render table with campaign data
- If `sales_trend` array exists → render bar chart
- If `recent_campaigns` array exists → render list
- If `ads` array exists → render table
- If array is empty or missing → section is not rendered

---

## Allowed Operations

✅ Display numbers as-is
✅ Format dates
✅ Apply color coding based on status
✅ Create visual hierarchy
✅ Responsive design

---

## NOT Allowed

❌ Calculate anything
❌ Aggregate data
❌ Replace null values
❌ Add defaults
❌ Transform data
❌ Make additional API calls
❌ Mock data
❌ Cache or store data

---

## Code Flow

### n8nWebhookService.ts

```typescript
export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  // Send POST request with user_id
  // Return raw response
}
```

### dashboardDataService.ts

```typescript
export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  // Simple wrapper
  return fetchDashboardData(userId);
}
```

### ProductionDashboard.tsx

```typescript
useEffect(() => {
  if (user) {
    const data = await fetchDashboardData(user.id);
    setDashboardData(data); // Store raw data
  }
}, [user]);
```

### ProductionHomeView.tsx

```typescript
// Display data exactly as received
<h2>{campaign.name}</h2>
<td>${campaign.spend}</td>
<td>{ad.impressions}</td>
```

---

## Console Logs (Only These)

```
[Dashboard] Sending POST request to n8n webhook
[Dashboard] Webhook response received
[Dashboard] Rendering data
```

---

## Types

All types are defined in `src/lib/dataTransformer.ts`:

```typescript
interface Campaign {
  id: string;
  name: string;
  spend: number;
  revenue: number;
  roas: number;
  status: string;
}

interface SalesTrend {
  date: string;
  sales: number;
}

interface RecentCampaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface Ad {
  id: string;
  name: string;
  status: string;
  impressions: number;
  clicks: number;
  spend: number;
}

interface DashboardData {
  top_5_campaigns?: Campaign[];
  sales_trend?: SalesTrend[];
  recent_campaigns?: RecentCampaign[];
  ads?: Ad[];
}
```

---

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/dataTransformer.ts` | Simplified to only type definitions |
| `src/lib/n8nWebhookService.ts` | Pure fetch, no transformation |
| `src/lib/dashboardDataService.ts` | Simple wrapper |
| `src/components/dashboard/ProductionHomeView.tsx` | Raw data display only |
| `src/components/dashboard/SalesTrendChart.tsx` | Simple chart renderer |

---

## Testing

Open DevTools (F12) → Console:

```
[Dashboard] Sending POST request to n8n webhook
[Dashboard] Webhook response received
```

If you see these logs:
- ✅ Webhook was called
- ✅ Response was received
- ✅ Data is being displayed

---

## Error Handling

If webhook fails:
- Error is logged to console
- Error is thrown
- User sees "Failed to load dashboard data" message
- No fallback data is shown

---

## Summary

This is the simplest possible dashboard:

1 Request → 1 Response → Display

No complex logic. No transformations. No calculations.

Just fetch and display.

---

**Version:** 2.0 (Simplified)
**Status:** ✅ Production Ready
