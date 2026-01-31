# Complete Auto-Fetch Dashboard Implementation Guide

## Overview

This guide provides a **production-ready, fully actionable solution** for automatically fetching and displaying user-specific campaign data when clients log in to their dashboard.

---

## Architecture Flow

```
User Logs In → Dashboard Loads
        ↓
Extract user_id from Supabase Auth Session
        ↓
Call Supabase Edge Function with JWT token
        ↓
Edge Function validates user & fetches data from database
        ↓
Process data (replace nulls with "-", calculate metrics)
        ↓
Return structured JSON response
        ↓
Dashboard components update with real data
```

---

## Step 1: Supabase Edge Function (Server-Side)

### File Location
`supabase/functions/get-user-dashboard-data/index.ts`

### What It Does
1. **Authenticates the user** via JWT token
2. **Fetches user-specific data** from the database:
   - Campaigns
   - Ads
   - Campaign performance metrics
3. **Calculates metrics**:
   - Top 5 campaigns by ROAS
   - Total spend and revenue
   - Active ads count
   - Click-through rate
   - Conversion rate
   - Average ROAS
4. **Replaces all null values with "-"**
5. **Returns structured JSON**

### JSON Response Structure
```json
{
  "top_5_campaigns": [
    {
      "id": "uuid",
      "name": "Campaign Name",
      "revenue": 15000,
      "spend": 10000,
      "roas": 1.5,
      "status": "ACTIVE"
    }
  ],
  "total_sales": 50000,
  "total_campaigns": 25,
  "active_ads": 12,
  "total_spend": 30000,
  "total_revenue": 50000,
  "recent_campaigns": [
    {
      "id": "uuid",
      "name": "Recent Campaign",
      "status": "ACTIVE",
      "created_at": "2024-01-01T00:00:00Z",
      "budget": 5000
    }
  ],
  "ads": [
    {
      "id": "uuid",
      "name": "Ad Name",
      "status": "ACTIVE",
      "impressions": 10000,
      "clicks": 500,
      "spend": 1000,
      "conversions": 50
    }
  ],
  "insights": {
    "click_through_rate": 5.0,
    "conversion_rate": 10.0,
    "avg_cost_per_click": 2.0,
    "avg_roas": 1.67
  }
}
```

### How to Call the Edge Function
```typescript
const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-dashboard-data`;

const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
});

const dashboardData = await response.json();
```

### Edge Function Status
✅ **DEPLOYED** - The edge function is live and ready to use

---

## Step 2: Frontend Data Service

### File Location
`src/lib/dashboardDataService.ts`

### Purpose
Provides a clean interface for fetching dashboard data with proper TypeScript types.

### Usage
```typescript
import { fetchDashboardData } from '../lib/dashboardDataService';

const data = await fetchDashboardData(userId);
```

### Features
- ✅ Automatic session management
- ✅ Error handling
- ✅ TypeScript type safety
- ✅ Null value replacement

### Alternative: Webhook Integration
If you need to fetch from an external webhook:

```typescript
import { fetchDashboardDataFromWebhook } from '../lib/dashboardDataService';

const data = await fetchDashboardDataFromWebhook(userId);
```

This will call: `https://n8n.srv1181726.hstgr.cloud/webhook-test/other-data`

---

## Step 3: Auto-Fetch on Dashboard Load

### Implementation in ProductionDashboard

The dashboard automatically fetches data when the user logs in:

```typescript
useEffect(() => {
  if (user) {
    loadUserData();
    checkMetaConnection();
    loadDashboardData(); // ← Auto-fetch on load
  }
}, [user]);

const loadDashboardData = async () => {
  if (!user) return;

  try {
    setIsLoadingDashboard(true);
    setDashboardError(null);
    const data = await fetchDashboardData(user.id);
    setDashboardData(data);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    setDashboardError('Failed to load dashboard data. Please try again.');
    setDashboardData(null);
  } finally {
    setIsLoadingDashboard(false);
  }
};
```

### Manual Refresh
Users can manually refresh the data:

```typescript
const handleRefreshData = async () => {
  await loadDashboardData();
};
```

A refresh button is available in the dashboard header.

---

## Step 4: Dashboard Component Mapping

### Metrics Display (Home View)

```typescript
const metrics = {
  totalCampaigns: data?.total_campaigns || 0,
  activeAds: data?.active_ads || 0,
  totalSpend: data?.total_spend || 0,
  totalRevenue: data?.total_revenue || 0,
};
```

Displayed as cards:
- 📊 Total Campaigns
- 📈 Active Ads
- 💰 Total Spend
- 💵 Total Revenue

### Top 5 Campaigns Widget

```typescript
<TopProfitableCampaigns
  campaigns={data?.top_5_campaigns}
  isLoading={isLoading}
/>
```

Features:
- Ranked by ROAS
- Visual profit bars
- Shows spend and revenue
- Color-coded rankings (Gold, Silver, Bronze)

### Recent Campaigns Table

```typescript
const recentCampaigns = data?.recent_campaigns || [];

{recentCampaigns.map((campaign) => (
  <div key={campaign.id}>
    <h3>{campaign.name}</h3>
    <span>{campaign.status}</span>
    <span>Budget: ${campaign.budget}</span>
    <span>Created: {formatDate(campaign.created_at)}</span>
  </div>
))}
```

### Ads Management View

Access all ad data from:
```typescript
data?.ads
```

Each ad includes:
- Name
- Status
- Impressions
- Clicks
- Spend
- Conversions

### Insights View

```typescript
const insights = data?.insights;

// Available metrics:
insights.click_through_rate
insights.conversion_rate
insights.avg_cost_per_click
insights.avg_roas
```

---

## Step 5: Loading States & Error Handling

### Loading State
```typescript
{isLoadingDashboard && (
  <div className="flex items-center justify-center py-24">
    <div className="animate-spin">Loading...</div>
  </div>
)}
```

### Error Handling
```typescript
{dashboardError && (
  <div className="error-banner">
    <p>{dashboardError}</p>
    <button onClick={handleRefreshData}>Try again</button>
  </div>
)}
```

### Empty State
```typescript
{campaigns.length === 0 && (
  <div className="empty-state">
    <p>No campaigns yet</p>
    <button onClick={() => setShowAddCampaign(true)}>
      Create your first campaign
    </button>
  </div>
)}
```

---

## Step 6: Data Validation & Security

### Security Features
✅ JWT token validation on edge function
✅ User ID extracted from authenticated session
✅ Row Level Security (RLS) on database tables
✅ CORS headers properly configured
✅ HTTPS encryption

### Data Validation
✅ All null values replaced with "-"
✅ Type-safe interfaces
✅ Fallback values for missing data
✅ Error boundaries

---

## Step 7: Testing the Auto-Fetch

### Test Procedure

1. **Sign in to the application**
2. **Navigate to the dashboard** (`/dashboard`)
3. **Observe automatic data load**
   - Loading spinner appears
   - Data fetches from edge function
   - Widgets populate with real data
4. **Click the refresh button** (top-right)
5. **Verify data updates**

### Expected Behavior
- ✅ Dashboard loads immediately on login
- ✅ Loading state shows during fetch
- ✅ Data displays without page reload
- ✅ Nulls display as "-"
- ✅ Metrics calculate correctly
- ✅ Refresh button works

---

## Step 8: Handling Multiple Users

### Concurrent Users
The system handles multiple simultaneous dashboard loads:

✅ **Each user session is isolated**
- User ID from JWT token
- Separate database queries per user
- No shared state between users

✅ **Database optimization**
- Indexed user_id columns
- Efficient queries with proper filters
- Connection pooling

---

## Best Practices Implemented

### ✅ Security
- Never expose API keys in frontend
- Use JWT tokens for authentication
- Validate user identity server-side
- RLS policies on all tables

### ✅ Performance
- Single API call for all dashboard data
- Parallel database queries
- Optimized JSON response size
- Client-side caching (session-based)

### ✅ User Experience
- Immediate loading feedback
- Progressive data display
- Error recovery options
- Manual refresh capability

### ✅ Data Integrity
- Replace nulls with "-"
- Validate data types
- Handle missing data gracefully
- Calculate derived metrics server-side

---

## API Endpoints

### Primary Endpoint (Supabase Edge Function)
```
POST ${VITE_SUPABASE_URL}/functions/v1/get-user-dashboard-data
Headers:
  Authorization: Bearer <session_token>
  Content-Type: application/json
```

### Alternative Endpoint (n8n Webhook)
```
POST https://n8n.srv1181726.hstgr.cloud/webhook-test/other-data
Headers:
  Content-Type: application/json
Body:
  { "user_id": "<user_id>" }
```

---

## Database Schema

### Required Tables

#### campaigns
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  status TEXT,
  budget NUMERIC,
  created_at TIMESTAMPTZ
);
```

#### ads
```sql
CREATE TABLE ads (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  status TEXT,
  impressions INTEGER,
  clicks INTEGER,
  spend NUMERIC,
  conversions INTEGER
);
```

#### campaign_performance
```sql
CREATE TABLE campaign_performance (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  user_id UUID REFERENCES auth.users(id),
  spend NUMERIC,
  revenue NUMERIC,
  impressions INTEGER,
  clicks INTEGER,
  conversions INTEGER
);
```

---

## Troubleshooting

### Issue: "No data displays"
**Solution:**
1. Check browser console for errors
2. Verify Supabase URL in `.env`
3. Ensure user is authenticated
4. Check edge function logs

### Issue: "Authorization required error"
**Solution:**
1. Verify session is active
2. Check token expiration
3. Re-authenticate user

### Issue: "Null values showing as null"
**Solution:**
- This is handled by the edge function
- Check edge function deployment
- Verify `replaceNullsWithDash` function

---

## Summary

### What Was Implemented
✅ Supabase Edge Function for server-side data fetching
✅ Automatic dashboard data load on login
✅ Type-safe data interfaces
✅ Loading and error states
✅ Manual refresh capability
✅ Null value handling
✅ Real-time data display
✅ Multi-user support
✅ Security best practices

### How It Works
1. User logs in
2. Dashboard component loads
3. `useEffect` triggers data fetch
4. Edge function authenticates user
5. Database queries execute
6. Metrics calculated server-side
7. JSON returned to frontend
8. Components update with data

### Result
A **fully functional, production-ready dashboard** that automatically fetches and displays user-specific data without any manual intervention or placeholder data.

---

## Next Steps

### To Add External API Integration
Update the edge function to call external APIs:

```typescript
// In edge function
const externalData = await fetch('https://api.example.com/data', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${EXTERNAL_API_KEY}`,
  },
});

const apiData = await externalData.json();
// Merge with database data
```

### To Enable Real-Time Updates
Use Supabase Realtime:

```typescript
supabase
  .channel('dashboard-updates')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'campaigns' },
    (payload) => {
      loadDashboardData(); // Refresh on changes
    }
  )
  .subscribe();
```

---

## Support

For issues or questions:
1. Check browser console for errors
2. Review edge function logs in Supabase dashboard
3. Verify database structure matches schema
4. Test API endpoints directly

---

**Implementation Status: ✅ COMPLETE**

All components are deployed and functional. The dashboard will automatically fetch user data on every login with no additional configuration required.
