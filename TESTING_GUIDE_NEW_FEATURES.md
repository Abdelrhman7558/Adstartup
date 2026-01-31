# Testing Guide - New Features

## Quick Testing Checklist

Use this guide to verify all newly implemented features work correctly.

---

## 1. AUTHENTICATION & ONBOARDING FLOW

### Test: Signup Redirect
1. Navigate to `/signup`
2. Fill in the signup form
3. Click "Sign Up"
4. ✅ **Expected:** Redirect to `/plans` page
5. ❌ **Fail if:** Redirects to signin or homepage

---

## 2. SUBSCRIPTION PROTECTION

### Test: Dashboard Access Without Subscription
1. Sign up as new user
2. Skip payment (try to navigate directly to `/dashboard`)
3. ✅ **Expected:** Automatically redirected to `/plans`
4. ❌ **Fail if:** Dashboard loads without subscription

### Test: Dashboard Access With Subscription
1. Complete payment on Plans page
2. Submit brief
3. Navigate to `/dashboard`
4. ✅ **Expected:** Dashboard loads successfully
5. ❌ **Fail if:** Redirected away or shows error

---

## 3. NOTIFICATIONS SYSTEM

### Test: Notifications Dropdown
1. Log in to dashboard
2. Look for bell icon in top-right header
3. ✅ **Expected:** Bell icon visible
4. Click bell icon
5. ✅ **Expected:** Dropdown opens showing notifications
6. ❌ **Fail if:** No bell icon or dropdown doesn't open

### Test: Create Test Notification
Run this SQL in Supabase:
```sql
INSERT INTO notifications (user_id, title, message, type)
VALUES (
  'YOUR_USER_ID',
  'Test Notification',
  'This is a test message',
  'info'
);
```

Then:
1. Refresh dashboard
2. Check bell icon for unread count badge
3. Click bell to see notification
4. ✅ **Expected:** Badge shows "1", notification appears in list

### Test: Delete Notification
1. Open notifications dropdown
2. Click delete (X) button on a notification
3. ✅ **Expected:** Notification removed immediately
4. ❌ **Fail if:** Notification still appears after delete

### Test: Mark as Read
1. Open notifications dropdown
2. Click check mark on unread notification
3. ✅ **Expected:** Notification marked as read, badge count decreases
4. ❌ **Fail if:** No visual change

---

## 4. SALES TREND CHART

### Test: Chart Display
1. Navigate to dashboard home view
2. Scroll down past summary cards
3. ✅ **Expected:** See "Sales Trend" chart with bars
4. Chart should show 7 days of data
5. Hover over bars to see values
6. ✅ **Expected:** Tooltip appears on hover

### Test: With Live Data
1. Verify webhook returns data:
```bash
curl https://n8n.srv1181726.hstgr.cloud/webhook-test/other-data
```

2. Check response includes `salesTrend` field
3. Refresh dashboard
4. ✅ **Expected:** Chart displays real data from webhook
5. ❌ **Fail if:** Chart shows "Failed to load" error

### Test: With Mock Data
1. If webhook returns empty `salesTrend`
2. ✅ **Expected:** Chart shows mock data (sample bars)
3. Warning message appears: "Showing sample data"
4. ❌ **Fail if:** Chart is completely blank

---

## 5. TOP 5 PROFITABLE CAMPAIGNS

### Test: Widget Display
1. Navigate to dashboard home view
2. Look for "Top 5 Profitable Campaigns" widget
3. ✅ **Expected:** Widget visible next to Sales Trend Chart
4. Shows ranked list with profit amounts
5. ❌ **Fail if:** Widget missing or empty

### Test: With Live Data
1. Verify webhook returns campaigns:
```bash
curl https://n8n.srv1181726.hstgr.cloud/webhook-test/campaigns-analysis
```

2. Check response includes campaign objects with spend/revenue
3. Refresh dashboard
4. ✅ **Expected:** Widget shows campaigns sorted by profit
5. Top campaign has gold badge (#1)
6. ❌ **Fail if:** No campaigns appear

### Test: Profit Calculation
1. Check a campaign's displayed profit
2. Verify: Profit = Revenue - Spend
3. ✅ **Expected:** Math is correct
4. Green color if positive, red if negative
5. ❌ **Fail if:** Incorrect calculations

---

## 6. ADD CAMPAIGN WEBHOOK

### Test: Campaign Creation
1. Navigate to dashboard
2. Ensure Meta is connected
3. Click "Add Campaign" button
4. Fill in all 5 required fields:
   - Campaign Name
   - Campaign Objective
   - Target Country
   - Daily Budget
   - Campaign Notes (optional)
5. Upload test files (optional)
6. Click "Create Campaign"
7. ✅ **Expected:** Campaign created successfully
8. Check browser console for webhook log

### Test: Webhook POST
1. Open browser DevTools → Network tab
2. Create a new campaign
3. Look for POST request to:
   `https://n8n.srv1181726.hstgr.cloud/webhook/Add-Campain`
4. ✅ **Expected:** POST request sent with campaign data
5. Check payload includes:
   - user_id
   - campaign_name
   - campaign_objective
   - target_country
   - daily_budget
   - timestamp
   - files (if uploaded)
6. ❌ **Fail if:** No POST request sent

### Test: Webhook Failure
1. Disconnect internet or block webhook URL
2. Create campaign
3. ✅ **Expected:** Campaign still created in DB
4. Console shows warning: "Failed to send campaign to webhook"
5. ❌ **Fail if:** Campaign creation fails entirely

---

## 7. DASHBOARD DATA INTEGRATION

### Test: Campaigns Data
1. Check if campaigns appear in Recent Campaigns
2. Verify data comes from webhook
3. Test URL:
```bash
curl https://n8n.srv1181726.hstgr.cloud/webhook-test/campaigns-analysis
```

4. ✅ **Expected:** Campaigns display if webhook returns data
5. ❌ **Fail if:** Data doesn't appear despite webhook success

### Test: Ads Data
1. Navigate to Ads tab in dashboard
2. Check if ads table populates
3. Test URL:
```bash
curl https://n8n.srv1181726.hstgr.cloud/webhook-test/Ads-Anlaysis
```

4. ✅ **Expected:** Ads appear if webhook returns data
5. Table shows: Name, Profit, Loss, Impressions
6. ❌ **Fail if:** Table empty despite webhook success

### Test: Dashboard Metrics
1. Check summary cards on home view
2. Test URL:
```bash
curl https://n8n.srv1181726.hstgr.cloud/webhook-test/other-data
```

3. ✅ **Expected:** Metrics update if webhook returns data
4. Shows: Total Campaigns, Active Ads, Spend, Revenue
5. ❌ **Fail if:** Metrics don't reflect webhook data

---

## 8. ONBOARDING FLOW (END-TO-END)

### Complete Flow Test:
1. **Sign Up**
   - Go to `/signup`
   - Create new account
   - ✅ Redirected to `/plans`

2. **Select Plan**
   - Choose a plan on Plans page
   - Click "Subscribe" or payment button
   - Complete payment
   - ✅ Subscription created in DB

3. **Submit Brief**
   - Redirected to `/brief`
   - Answer all questions
   - Click submit
   - ✅ Redirected to `/dashboard`

4. **Access Dashboard**
   - Dashboard loads successfully
   - All widgets visible
   - No redirect loops
   - ✅ Can see campaigns, ads, analytics

### Flow Validation:
```
signup → plans → payment → brief → dashboard
   ✓       ✓        ✓        ✓         ✓
```

---

## 9. ERROR HANDLING

### Test: Webhook Failures
1. Block webhook URLs in DevTools
2. Load dashboard
3. ✅ **Expected:** Dashboard still loads
4. Widgets show mock data or empty states
5. No breaking errors
6. ❌ **Fail if:** Dashboard crashes or shows error page

### Test: No Subscription
1. Create user without subscription
2. Try to access `/dashboard`
3. ✅ **Expected:** Redirected to `/plans`
4. Clear message: "Please select a plan"
5. ❌ **Fail if:** Dashboard loads or shows error

### Test: Network Errors
1. Go offline
2. Try to load dashboard
3. ✅ **Expected:** Graceful error messages
4. "Failed to load data" messages
5. Retry options available
6. ❌ **Fail if:** Blank screen or crash

---

## 10. REGRESSION TESTS

Ensure old features still work:

### Test: Meta Connection
1. Click "Connect Meta" in header
2. ✅ **Expected:** Meta OAuth flow works
3. User can select ad account, pixel, catalog
4. ❌ **Fail if:** Connection broken

### Test: Add Campaign Modal
1. Click "Add Campaign"
2. ✅ **Expected:** Modal opens
3. All 5 fields present
4. File upload works
5. Folder upload blocked
6. ❌ **Fail if:** Modal broken

### Test: Settings
1. Click Settings in sidebar
2. ✅ **Expected:** Modal opens with 3 tabs
3. Can update display name
4. Can change password
5. Edit Brief button works
6. Theme toggle works
7. ❌ **Fail if:** Settings broken

### Test: Assets Upload
1. Navigate to Assets tab
2. Upload files
3. ✅ **Expected:** Files upload successfully
4. Folder upload blocked
5. Edit mode works
6. Delete works
7. ❌ **Fail if:** Upload broken

---

## QUICK DEBUGGING

### If Notifications Don't Appear:
1. Check Supabase: `SELECT * FROM notifications WHERE user_id = 'YOUR_USER_ID'`
2. Verify RLS policies allow read access
3. Check browser console for errors
4. Ensure user is authenticated

### If Webhooks Fail:
1. Test webhook URLs directly with curl
2. Check CORS headers in response
3. Verify network tab shows requests
4. Check console for error messages

### If Dashboard Redirects Loop:
1. Check subscription status in DB
2. Verify SubscriptionProtectedRoute logic
3. Clear browser cache
4. Check Auth state in React DevTools

### If Widgets Don't Load:
1. Check console for import errors
2. Verify component files exist
3. Check webhook response format
4. Verify mock data fallback works

---

## BROWSER CONSOLE CHECKS

### Expected Console Output (No Errors):

**On Dashboard Load:**
```
[Fetching campaigns data...]
[Fetching ads data...]
[Fetching dashboard metrics...]
[Notifications loaded: X items]
```

**On Campaign Creation:**
```
[Campaign created successfully]
[Sending to webhook...]
[Webhook response: success/failed]
```

**Red Flags (Should NOT appear):**
```
❌ TypeError: Cannot read property...
❌ 403 Forbidden
❌ CORS error
❌ Uncaught promise rejection
```

---

## DATABASE VERIFICATION

### Check Subscription Created:
```sql
SELECT * FROM subscriptions
WHERE user_id = 'YOUR_USER_ID'
AND status = 'active';
```

### Check Notifications Exist:
```sql
SELECT * FROM notifications
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

### Check Campaigns Saved:
```sql
SELECT * FROM user_campaigns
WHERE user_id = 'YOUR_USER_ID';
```

---

## PASS/FAIL CRITERIA

### ✅ PASS if:
- All 8 major features work
- No console errors
- Build succeeds
- Dashboard loads
- Webhooks integrate
- Notifications work
- Widgets display
- Onboarding flow complete

### ❌ FAIL if:
- Dashboard crashes
- Webhooks break app
- Notifications don't show
- Widgets missing
- Subscription check doesn't work
- Build errors
- Old features broken

---

## TEST SUMMARY TEMPLATE

```
Feature: ________________
Status: [ ] Pass [ ] Fail
Notes: ________________
Console Errors: [ ] Yes [ ] No
```

---

**Testing Completed:** [Date]
**Tested By:** [Name]
**Environment:** [Dev/Staging/Production]
**Result:** [Pass/Fail]
