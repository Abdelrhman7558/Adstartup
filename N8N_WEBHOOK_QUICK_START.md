# n8n Webhook Integration - Quick Start Guide

## 🚀 Quick Setup

### 1. Configure Data Source

In `.env` file:
```env
VITE_DATA_SOURCE=n8n
```

### 2. n8n Webhook Endpoint

```
POST https://n8n.srv1181726.hstgr.cloud/webhook-test/other-data
```

### 3. JSON Request Format

```json
{
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### 4. Expected JSON Response

```json
{
  "top_5_campaigns": [...],
  "total_sales": 12345,
  "total_campaigns": 20,
  "active_ads": 12,
  "total_spend": 10000,
  "total_revenue": 15000,
  "recent_campaigns": [...],
  "ads": [...],
  "insights": {
    "click_through_rate": 5.0,
    "conversion_rate": 2.1,
    "avg_cost_per_click": 0.4,
    "avg_roas": 1.67
  }
}
```

---

## 📊 Dashboard Widgets Mapping

| JSON Field | Widget | Component |
|-----------|--------|-----------|
| `top_5_campaigns` | Leaderboard | TopProfitableCampaigns |
| `total_sales` | Number | Metric Card |
| `total_campaigns` | Number | Metric Card |
| `active_ads` | Number | Metric Card |
| `total_spend` | Currency | Metric Card |
| `total_revenue` | Currency | Metric Card |
| `recent_campaigns` | Table | Campaign Table |
| `ads` | Grid | Ads Grid |
| `insights` | Chart | Insights View |

---

## ⚡ Trigger Points

### 1. Dashboard Load
```
User logs in → Dashboard loads → Webhook triggers automatically
```

### 2. Campaign Creation
```
User creates campaign → Campaign saved → Webhook triggers → Dashboard refreshes
```

---

## 🧪 Test the Integration

### Test Dashboard Load
```bash
# 1. Start dev server
npm run dev

# 2. Log in to dashboard

# 3. Check console for:
[n8n Webhook] Triggering webhook for user: ...
[n8n Webhook] Received response: ...
```

### Test Campaign Creation
```bash
# 1. Click "Add Campaign"
# 2. Fill form and submit
# 3. Check console for:
[Campaign Created] Triggering dashboard data refresh webhook
[Campaign Created] Dashboard data refresh webhook sent successfully
```

### Test n8n Webhook Directly
```bash
curl -X POST https://n8n.srv1181726.hstgr.cloud/webhook-test/other-data \
  -H "Content-Type: application/json" \
  -d '{"user_id": "your-user-id-here"}'
```

---

## 🔧 n8n Workflow Requirements

### 1. Webhook Node
- **Method:** POST
- **Path:** `/webhook-test/other-data`
- **Response Mode:** Using Respond to Webhook

### 2. Process Flow
```
Webhook Trigger
    ↓
Extract user_id
    ↓
Validate user_id format
    ↓
Fetch user data from APIs/DB
    ↓
Calculate metrics
    ↓
Replace nulls with "-"
    ↓
Return JSON response
```

### 3. Response Requirements
- **Status Code:** 200
- **Content-Type:** application/json
- **All null values replaced with "-"**

---

## 🔐 Security Checklist

✅ HTTPS enabled
✅ user_id validated (UUID format)
✅ Rate limiting configured
✅ Error messages don't expose internals
✅ Database queries use indexes

---

## 🐛 Troubleshooting

### Issue: "Webhook request failed"
**Solution:** Check n8n workflow is active and accessible

### Issue: "No data displaying"
**Solution:** Verify JSON response format matches expected structure

### Issue: "Nulls showing as 'null'"
**Solution:** Ensure n8n replaces nulls with "-" before returning

### Issue: "Dashboard doesn't refresh after campaign"
**Solution:** Check console logs for webhook trigger confirmation

---

## 📁 Key Files

- `src/lib/n8nWebhookService.ts` - Webhook service
- `src/lib/dashboardDataService.ts` - Data fetching
- `src/pages/ProductionDashboard.tsx` - Dashboard page
- `src/components/dashboard/AddCampaignModal.tsx` - Campaign creation

---

## 🎯 Expected Behavior

### On Dashboard Load
1. User logs in
2. Dashboard component mounts
3. useEffect triggers
4. POST request sent to n8n
5. Loading spinner shows
6. Response received
7. Widgets populate with data

### On Campaign Creation
1. User fills campaign form
2. Campaign saved to database
3. Assets uploaded (if any)
4. Add-Campaign webhook called
5. **Dashboard refresh webhook called**
6. Modal closes
7. Dashboard data updates automatically

---

## 🔄 Fallback System

If n8n webhook fails:
```
n8n Webhook (primary)
    ↓ (on failure)
Supabase Edge Function (fallback)
```

To disable fallback and use n8n only:
```typescript
// In dashboardDataService.ts
if (DATA_SOURCE === 'n8n') {
  return fetchDashboardDataFromN8N(userId);
  // Remove try-catch fallback if you want n8n only
}
```

---

## 📞 Support

**Full Documentation:** See `N8N_WEBHOOK_COMPLETE_GUIDE.md`

**Console Logs to Check:**
- `[Dashboard Service] Using data source: n8n`
- `[n8n Webhook] Triggering webhook for user: ...`
- `[n8n Webhook] Received response: ...`
- `[Campaign Created] Triggering dashboard data refresh webhook`

**Common n8n Workflow Errors:**
1. Check webhook node is configured correctly
2. Verify response format matches expected structure
3. Ensure null replacement function exists
4. Check database connection in n8n

---

**Status: ✅ Ready to Use**

Set `VITE_DATA_SOURCE=n8n` in `.env` and start the application. The dashboard will automatically use n8n webhooks for all data fetching.
