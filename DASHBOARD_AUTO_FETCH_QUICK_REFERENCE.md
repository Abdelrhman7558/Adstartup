# Dashboard Auto-Fetch Quick Reference

## 🎯 What Was Built

A **production-ready dashboard system** that automatically fetches user-specific campaign data when they log in. No mock data, no placeholders - everything is real.

---

## ⚡ Quick Start

### For End Users
1. Log in to your account
2. Dashboard loads automatically
3. Your data displays instantly
4. Click refresh button to update

### For Developers
```typescript
// Data fetches automatically on dashboard load
import { fetchDashboardData } from './lib/dashboardDataService';

const data = await fetchDashboardData(userId);
```

---

## 📊 Data Structure

```json
{
  "top_5_campaigns": [...],      // Best campaigns by ROAS
  "total_sales": 50000,          // Sum of all revenue
  "total_campaigns": 25,         // Count of campaigns
  "active_ads": 12,              // Count of active ads
  "total_spend": 30000,          // Sum of all spend
  "total_revenue": 50000,        // Sum of all revenue
  "recent_campaigns": [...],     // Latest 10 campaigns
  "ads": [...],                  // All ad details
  "insights": {                  // Calculated metrics
    "click_through_rate": 5.0,
    "conversion_rate": 10.0,
    "avg_cost_per_click": 2.0,
    "avg_roas": 1.67
  }
}
```

---

## 🔧 Key Components

### 1. Edge Function
**File:** `supabase/functions/get-user-dashboard-data/index.ts`
- ✅ Deployed and live
- Authenticates users
- Fetches from database
- Calculates metrics
- Replaces nulls with "-"

### 2. Data Service
**File:** `src/lib/dashboardDataService.ts`
- Type-safe interfaces
- Session management
- Error handling

### 3. Dashboard Component
**File:** `src/pages/ProductionDashboard.tsx`
- Auto-fetch on load
- Loading states
- Error handling
- Manual refresh

### 4. Home View
**File:** `src/components/dashboard/ProductionHomeView.tsx`
- Metric cards
- Top campaigns widget
- Recent campaigns table

---

## 🔐 Security

✅ JWT token authentication
✅ User ID from session (never from URL)
✅ RLS policies on all tables
✅ Server-side data validation
✅ CORS properly configured

---

## 🎨 Dashboard Widgets

### Metrics Cards
- Total Campaigns
- Active Ads
- Total Spend
- Total Revenue

### Top 5 Campaigns
- Ranked by profitability
- Visual profit bars
- ROAS metrics

### Recent Campaigns
- Latest campaigns
- Status badges
- Budget information

---

## 🔄 Data Flow

```
Login → useEffect triggered → fetchDashboardData() →
Edge Function → Database Query → Calculate Metrics →
JSON Response → Update UI
```

---

## 📞 API Endpoint

```bash
POST ${VITE_SUPABASE_URL}/functions/v1/get-user-dashboard-data

Headers:
  Authorization: Bearer <session_token>
  Content-Type: application/json
```

---

## 🛠️ How to Test

1. **Start dev server:** `npm run dev`
2. **Log in** to the dashboard
3. **Observe:** Data loads automatically
4. **Click** the refresh button (top-right)
5. **Verify:** Data updates without page reload

---

## 🔍 Troubleshooting

### No data showing?
- Check console for errors
- Verify Supabase URL in `.env`
- Ensure user is logged in

### Authorization error?
- Session may have expired
- Log out and log back in

### Nulls showing as "null"?
- Edge function handles this automatically
- Verify edge function is deployed

---

## 📝 Database Tables Required

- `campaigns` - Campaign data
- `ads` - Ad details
- `campaign_performance` - Performance metrics

All tables must have:
- `user_id` column
- RLS policies enabled
- Indexes on `user_id`

---

## 🚀 Features

✅ Auto-fetch on login
✅ Real-time data updates
✅ Loading states
✅ Error handling
✅ Manual refresh
✅ Null value replacement
✅ Multi-user support
✅ Type-safe TypeScript
✅ Production-ready

---

## 📦 Files Created/Modified

### Created
- `supabase/functions/get-user-dashboard-data/index.ts`
- `src/hooks/useDashboardData.ts`
- `AUTO_FETCH_DASHBOARD_GUIDE.md`
- `DASHBOARD_AUTO_FETCH_QUICK_REFERENCE.md`

### Modified
- `src/lib/dashboardDataService.ts`
- `src/components/dashboard/ProductionHomeView.tsx`
- `src/components/dashboard/TopProfitableCampaigns.tsx`
- `src/pages/ProductionDashboard.tsx`

---

## 🎉 Result

**A fully functional dashboard that:**
- Loads user data automatically on login
- Displays real data from the database
- Handles errors gracefully
- Supports multiple concurrent users
- Follows security best practices
- Works in production

**No placeholders. No mock data. Everything is real.**

---

## 📚 Full Documentation

See `AUTO_FETCH_DASHBOARD_GUIDE.md` for complete implementation details, architecture, and advanced configuration.

---

**Status: ✅ COMPLETE AND DEPLOYED**
