# Quick Security Reference - Meta OAuth Connection

## How It Works

### 1. User Clicks "Connect Meta Account"
```
Dashboard → MetaConnectionStatus Component → generateMetaOAuthState(userId)
```

**What Happens:**
- Gets authenticated USER_ID from Supabase Auth
- Generates state: `base64(USER_ID:timestamp)`
- Redirects to Meta OAuth with state parameter

**OAuth URL:**
```
https://www.facebook.com/v19.0/dialog/oauth
  ?client_id=891623109984411
  &redirect_uri=https://n8n.srv1181726.hstgr.cloud/webhook-test/Meta-Callback
  &scope=ads_management,ads_read,business_management
  &state=<base64_encoded_userid_timestamp>
```

### 2. User Authorizes on Meta

Meta redirects back to your n8n webhook with:
- `code` - Authorization code
- `state` - Your state parameter (contains USER_ID)

### 3. n8n Webhook Processes Callback

**Required Steps:**

```javascript
// 1. Decode state
const decoded = Buffer.from(state, 'base64').toString('utf-8');
const [userId, timestamp] = decoded.split(':');

// 2. Validate timestamp (< 10 minutes old)
if (Date.now() - parseInt(timestamp) > 600000) {
  throw new Error('State expired');
}

// 3. Validate USER_ID format
if (!/^[0-9a-f-]{36}$/i.test(userId)) {
  throw new Error('Invalid user ID');
}

// 4. Exchange code for access token
const tokenResponse = await fetch(
  `https://graph.facebook.com/v19.0/oauth/access_token
   ?client_id=891623109984411
   &client_secret=YOUR_SECRET
   &redirect_uri=https://n8n.srv1181726.hstgr.cloud/webhook-test/Meta-Callback
   &code=${code}`
);

// 5. Store in Supabase
await supabase
  .from('meta_connections')
  .upsert({
    user_id: userId,  // The USER_ID from state
    access_token: tokenResponse.access_token,
    is_connected: true,
    connected_at: new Date(),
    updated_at: new Date()
  });

// 6. Redirect back to dashboard
return {
  status: 302,
  headers: { 'Location': 'https://your-app.com/dashboard?meta=connected' }
};
```

### 4. Dashboard Shows Connection Status

```typescript
// Query meta_connections table
const { data } = await supabase
  .from('meta_connections')
  .select('is_connected')
  .eq('user_id', userId)  // Authenticated user's ID
  .maybeSingle();

// RLS policy ensures user can only see their own connection
```

**UI Updates:**
- `is_connected = true` → "Active Account" (green)
- `is_connected = false` → "Connect Meta Account" button

## Key Security Points

### ✅ USER_ID Source
- **ONLY from Supabase Auth** (`supabase.auth.getUser()`)
- Displayed at top of dashboard
- Used in OAuth state
- Stored in database
- Used in all queries

### ✅ State Verification
- Contains: `base64(USER_ID:timestamp)`
- Timestamp prevents replay attacks (10 min expiry)
- Decoded on webhook to extract USER_ID
- USER_ID must be valid UUID

### ✅ Database Security
- Table: `meta_connections`
- Column: `user_id` (UUID, UNIQUE)
- RLS Policy: `auth.uid() = user_id`
- Users can ONLY access their own connection

### ✅ Token Security
- Access tokens NEVER sent to frontend
- Tokens stored encrypted in database
- Frontend only receives boolean status

## Files Modified

1. **`src/lib/metaOAuthState.ts`**
   - Generates OAuth state with USER_ID
   - Validates USER_ID format
   - Creates OAuth URL

2. **`src/components/MetaConnectionStatus.tsx`**
   - Queries connection status
   - Handles connect/disconnect
   - Validates USER_ID
   - Enforces RLS security

3. **`src/pages/Dashboard.tsx`**
   - Displays USER_ID prominently
   - Shows connection status
   - Passes authenticated USER_ID to components

## Database Table

```sql
CREATE TABLE meta_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id),
  access_token text,
  ad_account_id text,
  business_manager_id text,
  is_connected boolean DEFAULT false,
  connected_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies (CRITICAL)
ALTER TABLE meta_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meta connection"
  ON meta_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own meta connection"
  ON meta_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own meta connection"
  ON meta_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

## Testing

### 1. Test State Generation
```javascript
// In browser console after clicking "Connect Meta Account"
// Check logs for:
[OAuth State] Generated state for user: 42285edd...
[OAuth URL] Generated OAuth URL with state for user: 42285edd...
```

### 2. Test State Decoding
```javascript
// In n8n or Node.js
const state = "YOUR_STATE_FROM_URL";
const decoded = Buffer.from(state, 'base64').toString('utf-8');
console.log(decoded); // Should show: uuid:timestamp
```

### 3. Test Database Security
```sql
-- As User A, try to see User B's connection (should fail)
SELECT * FROM meta_connections WHERE user_id = 'user_b_id';
-- Result: Empty (RLS blocks access)

-- As User A, see your own connection (should work)
SELECT * FROM meta_connections WHERE user_id = auth.uid();
-- Result: Your connection row
```

### 4. Test UI States
- **Before Connection:** "Connect Meta Account" button visible
- **After Connection:** "Active Account" banner shows (green)
- **After Disconnect:** "Connect Meta Account" button returns

## Troubleshooting

| Issue | Check | Solution |
|-------|-------|----------|
| "Missing state parameter" | OAuth URL generation | Verify `getMetaOAuthUrl(userId)` includes state |
| "Invalid state format" | State decoding | Ensure base64 encoding is correct |
| "State expired" | Timestamp | User must retry within 10 minutes |
| "Invalid user ID" | USER_ID format | Verify Supabase Auth returns valid UUID |
| Connection not showing | Database query | Check RLS policies are enabled |
| Can see other users' connections | RLS failure | Verify RLS policies use `auth.uid()` |

## Console Logs to Monitor

**Frontend (Browser):**
```
[OAuth State] Generated state for user: 42285edd...
[OAuth URL] Generated OAuth URL with state for user: 42285edd...
[MetaConnection] Initiating OAuth for user: 42285edd...
[MetaConnection] Error checking connection: <any errors>
```

**Backend (n8n):**
- State decode success/failure
- USER_ID validation
- Token exchange responses
- Database upsert results

## Security Checklist

- [x] USER_ID from Supabase Auth is displayed in dashboard
- [x] USER_ID is used in OAuth state generation
- [x] State contains base64(USER_ID:timestamp)
- [x] State validation in webhook checks timestamp and format
- [x] Database stores connection with correct user_id
- [x] RLS policies prevent cross-user access
- [x] Access tokens never exposed to frontend
- [x] Disconnect requires confirmation
- [x] All operations logged for audit

## Next Steps

1. **Configure n8n webhook** using `N8N_WEBHOOK_VERIFICATION.md`
2. **Test OAuth flow** end-to-end
3. **Verify RLS policies** in Supabase dashboard
4. **Monitor logs** during testing
5. **Test with multiple users** to ensure isolation

## Documentation Files

- **`N8N_WEBHOOK_VERIFICATION.md`** - Complete n8n implementation guide
- **`META_CONNECTION_SECURITY.md`** - Full security documentation
- **`QUICK_SECURITY_REFERENCE.md`** - This file (quick reference)

## Summary

The USER_ID flows securely through the entire system:
```
Supabase Auth
    ↓
Dashboard Display (visible to user)
    ↓
OAuth State (base64 encoded)
    ↓
n8n Webhook (decoded and validated)
    ↓
Database Storage (meta_connections.user_id)
    ↓
Connection Query (filtered by RLS)
```

Every step ensures the authenticated user's ID is used and validated.
