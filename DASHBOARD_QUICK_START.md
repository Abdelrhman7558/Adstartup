# Dashboard Enhancement - Quick Start Guide

## 🚀 Key Features

### 1. Sidebar Navigation
- **Location**: `src/components/dashboard/SidebarNavigation.tsx`
- **Tabs**: Home | Analytics | Ads
- **Usage**: Click icon to switch tabs
- **Props**: `activeTab`, `onTabChange`, `metaConnected`

### 2. Ads Management
- **Location**: `src/components/dashboard/AdsTab.tsx`
- **Features**: View, sort, select, and control ads
- **Actions**: Kill, pause, activate individual ads
- **Bulk**: Kill All Ads button (top-right)

### 3. Webhooks
- **Configuration**: Set webhook URL in user profile
- **Automatic**: Triggered on ad actions
- **Retry**: Auto-retry with exponential backoff
- **Tracking**: View history in WebhookStatus component

---

## 📁 File Organization

```
Core Business Logic
├── src/lib/adManagement.ts (Ad CRUD + actions)
├── src/lib/webhookManager.ts (Webhook delivery)
└── src/lib/supabase.ts (Type definitions)

UI Components
├── src/components/dashboard/SidebarNavigation.tsx (Tab nav)
├── src/components/dashboard/AdsTab.tsx (Container)
├── src/components/dashboard/AdsManagementTable.tsx (Table)
├── src/components/dashboard/AdActionModal.tsx (Modal)
└── src/components/dashboard/WebhookStatus.tsx (Status)

Integration
└── src/pages/Dashboard.tsx (Main dashboard with tabs)

Database
└── supabase/migrations/create_*.sql (4 migrations)
```

---

## 🔄 Data Flow

### Fetch Ads
```
Dashboard → AdsTab.loadAds() → fetchAds(userId) → Supabase → UI
```

### Perform Action
```
User clicks action → Modal opens → onConfirm() →
triggerAdAction() → updateAdStatus() → sendWebhook() → n8n
```

### Kill All Ads
```
User clicks "Kill All Ads" → Modal → killAllAds() →
updateAllStatuses() → triggerKillAllAdsWebhook() → n8n
```

---

## 🎯 Common Tasks

### Add Custom Column to Table
1. Open `AdsManagementTable.tsx`
2. Add `<th>` in header
3. Add `<td>` in row rendering
4. Update type if needed

### Handle New Ad Action
1. Add action type to `AdActionType`
2. Update `AdActionModal.tsx` with action details
3. Add case in `AdsTab.executeModalAction()`
4. Create webhook trigger if needed

### Customize Webhook Payload
1. Edit `webhookManager.ts` payload builder
2. Test with n8n webhook receiver
3. Update tests

### Add Analytics Data
1. Replace placeholder in `Dashboard.tsx` line 359-365
2. Create `AnalyticsTab.tsx` component
3. Fetch data from Supabase
4. Display charts/metrics

---

## 🧪 Testing

### Check Ads Load
```typescript
const { data } = await supabase
  .from('ads')
  .select('*')
  .eq('user_id', userId);
console.log(data); // Should show ads
```

### Test Webhook Payload
```typescript
// Check recent webhooks
const webhooks = await getRecentWebhooks(userId, 5);
console.log(webhooks[0].payload); // View payload structure
```

### Verify RLS
```typescript
// Try accessing another user's ads (should fail)
const { data, error } = await supabase
  .from('ads')
  .select('*')
  .eq('user_id', 'other-user-id');
// Should get permission denied error
```

---

## 🔐 Security

### RLS Verification
✅ All tables require `auth.uid() = user_id`
✅ No cross-user access possible
✅ Admin needed to bypass RLS

### Webhook Safety
✅ URL stored in profile (configurable)
✅ Secret field available for HMAC
✅ Status tracked for debugging
✅ Can be disabled per-user

---

## 📊 Database Schema

### ads
```sql
id (uuid) | user_id (uuid) | name (text) | status (text) |
metadata (jsonb) | created_at | updated_at
```

### ad_actions
```sql
id (uuid) | user_id (uuid) | ad_id (uuid) | action_type (text) |
status (text) | error_message (text) | created_at
```

### webhooks
```sql
id (uuid) | user_id (uuid) | event_type (text) | payload (jsonb) |
target_url (text) | retry_count (int) | status (text) |
response_code (int) | created_at
```

### profiles (extended)
```sql
webhook_url (text) | webhook_secret (text) | enable_webhooks (boolean)
```

---

## 🐛 Debugging

### Check Console Logs
```javascript
// Ad operations
[Ads] Error fetching ads: Error details
[Ads] Updated ad status: uuid deleted

// Webhook operations
[Webhooks] Successfully sent webhook: kill_all_ads
[Webhooks] Retrying in 1000 ms...

// Component operations
[AdsTab] Error loading ads: Error message
[AdsTab] Killed 5 ads
```

### Database Queries
```typescript
// View recent actions
SELECT * FROM ad_actions
WHERE user_id = 'uuid'
ORDER BY created_at DESC
LIMIT 10;

// View webhook status
SELECT event_type, status, created_at FROM webhooks
WHERE user_id = 'uuid'
ORDER BY created_at DESC
LIMIT 5;
```

### Component State
```typescript
// In DevTools, check component state
AdsTab: { ads, loading, error, success, modalOpen, modalAction }
AdsManagementTable: { sortColumn, selectedAds, actionInProgress }
```

---

## ⚙️ Configuration

### Webhook Setup
1. Go to Dashboard → Settings
2. Enter webhook URL (e.g., `https://n8n.srv1181726.hstgr.cloud/webhook/...`)
3. Toggle "Enable Webhooks"
4. Save

### Ad Status Values
- `active` - Ad is running
- `paused` - Ad paused but can resume
- `disabled` - System disabled
- `deleted` - Permanently removed
- `unknown` - Sync failed

### Action Types
- `kill` - Permanently remove ad
- `remove` - Remove ad (same as kill)
- `pause` - Pause ad temporarily
- `activate` - Resume paused ad

---

## 📈 Performance Tips

### For Large Ad Lists
1. Add pagination to `fetchAds()`
2. Implement infinite scroll
3. Add client-side caching

### For Many Webhooks
1. Clean up old webhooks (retention policy)
2. Archive instead of delete
3. Query recent webhooks only

### For Bulk Operations
1. Batch webhook calls (group ads)
2. Show progress bar
3. Save checkpoint state

---

## 🔗 Related Files

### Authentication
- `src/contexts/AuthContext.tsx` - User data
- `src/lib/supabase.ts` - Client setup

### UI Utilities
- `src/lib/domainValidation.ts` - Form validation
- `src/hooks/useScrollAnimation.ts` - Animations

### Styling
- `tailwind.config.js` - Tailwind config
- `src/index.css` - Global styles

---

## 📞 Support

### Common Issues

**Webhooks not sending:**
1. Check webhook URL in profile
2. Verify webhooks enabled
3. Check n8n endpoint is live
4. View webhook status in database

**Ads not loading:**
1. Verify RLS policies applied
2. Check user_id correct
3. Verify user authenticated
4. Check network tab for errors

**Actions not working:**
1. Check modal error message
2. View console logs with prefix
3. Verify ad status is 'active'
4. Check user has permission

---

## 🎉 Success Indicators

✅ Sidebar tabs switching
✅ Ads loading and displaying
✅ Actions executing (status changes)
✅ Webhooks being sent and tracked
✅ Modal closing after action
✅ Error messages displaying
✅ No console errors

---

## 📝 Notes

- All state is local (no Redux/Context for dashboard)
- Each component is independent
- Errors don't affect other components
- Webhook failures don't block UI
- Build completes with no errors
- Production ready with RLS

---

**Ready to go! Happy coding!** 🚀
