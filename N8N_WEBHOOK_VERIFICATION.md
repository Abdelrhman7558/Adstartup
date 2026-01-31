# n8n Meta OAuth Callback Webhook Implementation Guide

This document provides the complete implementation guide for the Meta OAuth callback webhook in n8n that securely verifies and stores user connections.

## Webhook Endpoint

**URL:** `https://n8n.srv1181726.hstgr.cloud/webhook-test/Meta-Callback`

## Security Requirements

### 1. State Verification (CRITICAL)

The OAuth state parameter contains `base64(USER_ID:timestamp)` that MUST be verified:

```javascript
// Example n8n Code Node for State Decoding
const state = $input.params.state;

if (!state) {
  return { error: 'Missing state parameter' };
}

// Decode the base64 state
let decodedState;
try {
  const decoded = Buffer.from(state, 'base64').toString('utf-8');
  const [userId, timestamp] = decoded.split(':');

  if (!userId || !timestamp) {
    return { error: 'Invalid state format' };
  }

  // Verify timestamp is recent (within 10 minutes)
  const stateAge = Date.now() - parseInt(timestamp);
  const maxAge = 10 * 60 * 1000; // 10 minutes

  if (stateAge > maxAge) {
    return { error: 'State expired', age: stateAge };
  }

  decodedState = { userId, timestamp };

} catch (error) {
  return { error: 'Failed to decode state', details: error.message };
}

// USER_ID is now available in decodedState.userId
const authenticatedUserId = decodedState.userId;
```

### 2. User ID Validation

The USER_ID extracted from state must be a valid UUID:

```javascript
// Validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (!uuidRegex.test(authenticatedUserId)) {
  return { error: 'Invalid user ID format' };
}
```

### 3. Meta Account Response

The OAuth callback will include these parameters from Meta:

- `code` - Authorization code to exchange for access token
- `state` - The state parameter we sent (contains USER_ID)

## Database Storage

### Table: `meta_connections`

Store the connection with these fields:

```sql
-- Query to insert/update connection
INSERT INTO meta_connections (
  user_id,
  access_token,
  ad_account_id,
  business_manager_id,
  is_connected,
  connected_at,
  updated_at
) VALUES (
  $1,  -- authenticatedUserId from decoded state
  $2,  -- access_token from Meta token exchange
  $3,  -- ad_account_id (if available)
  $4,  -- business_manager_id (if available)
  true,
  NOW(),
  NOW()
)
ON CONFLICT (user_id)
DO UPDATE SET
  access_token = EXCLUDED.access_token,
  ad_account_id = EXCLUDED.ad_account_id,
  business_manager_id = EXCLUDED.business_manager_id,
  is_connected = true,
  connected_at = EXCLUDED.connected_at,
  updated_at = NOW();
```

## Complete n8n Workflow

### Step 1: Webhook Trigger
- Method: GET
- URL: `/webhook-test/Meta-Callback`
- Capture query parameters: `code`, `state`

### Step 2: Decode & Validate State (Code Node)

```javascript
// Get parameters
const code = $input.params.code;
const state = $input.params.state;

// Validation
if (!code) {
  return [{ json: { error: 'Missing authorization code', redirect: false } }];
}

if (!state) {
  return [{ json: { error: 'Missing state parameter', redirect: false } }];
}

// Decode state
let userId, timestamp;
try {
  const decoded = Buffer.from(state, 'base64').toString('utf-8');
  [userId, timestamp] = decoded.split(':');

  if (!userId || !timestamp) {
    throw new Error('Invalid state format');
  }

  // Validate timestamp (10 minutes max age)
  const stateAge = Date.now() - parseInt(timestamp);
  if (stateAge > 600000) {
    throw new Error('State expired');
  }

  // Validate UUID format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error('Invalid user ID format');
  }

} catch (error) {
  return [{ json: { error: error.message, redirect: false } }];
}

// Output validated data
return [{
  json: {
    userId: userId,
    code: code,
    timestamp: timestamp,
    verified: true
  }
}];
```

### Step 3: Exchange Code for Access Token (HTTP Request Node)

**URL:** `https://graph.facebook.com/v19.0/oauth/access_token`

**Method:** GET

**Query Parameters:**
- `client_id`: 891623109984411
- `client_secret`: YOUR_APP_SECRET (stored in n8n credentials)
- `redirect_uri`: https://n8n.srv1181726.hstgr.cloud/webhook-test/Meta-Callback
- `code`: `{{$json.code}}`

**Response Example:**
```json
{
  "access_token": "EAAMxxxx...",
  "token_type": "bearer",
  "expires_in": 5183944
}
```

### Step 4: Get Meta User Info (HTTP Request Node)

**URL:** `https://graph.facebook.com/v19.0/me`

**Method:** GET

**Query Parameters:**
- `fields`: id,name,email
- `access_token`: `{{$json.access_token}}`

### Step 5: Store in Supabase (Supabase Node or HTTP Request)

**Table:** `meta_connections`

**Operation:** Upsert (Insert or Update)

**Data:**
```json
{
  "user_id": "{{$node['Decode State'].json.userId}}",
  "access_token": "{{$node['Exchange Token'].json.access_token}}",
  "is_connected": true,
  "connected_at": "{{new Date().toISOString()}}",
  "updated_at": "{{new Date().toISOString()}}"
}
```

**Match Fields:** `user_id`

### Step 6: Success Response (Return Response Node)

Redirect user back to dashboard:

```javascript
return {
  status: 302,
  headers: {
    'Location': 'https://your-app-domain.com/dashboard?meta=connected'
  }
};
```

## Security Checklist

- [ ] State parameter is always verified and decoded
- [ ] Timestamp in state is validated (not expired)
- [ ] USER_ID format is validated (UUID)
- [ ] USER_ID from state matches Supabase Auth user
- [ ] Access token is stored securely in database
- [ ] Access token is never exposed to frontend
- [ ] Connection is tied to only ONE user (user_id is unique in table)
- [ ] Failed verifications return appropriate error messages
- [ ] Successful connections redirect back to dashboard

## Testing

### Test OAuth Flow:

1. **Start Connection:**
   - Login to dashboard
   - Note your USER_ID displayed at top
   - Click "Connect Meta Account"
   - Verify redirect URL contains `state` parameter

2. **Decode State Manually:**
   ```javascript
   const state = "YOUR_STATE_FROM_URL";
   const decoded = atob(state);
   console.log(decoded); // Should show: userId:timestamp
   ```

3. **Verify Database:**
   ```sql
   SELECT user_id, is_connected, connected_at
   FROM meta_connections
   WHERE user_id = 'YOUR_USER_ID';
   ```

4. **Check Dashboard:**
   - Connection status should show "Active Account" (green)
   - Disconnect button should appear

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Missing state parameter | State not included in callback | Check OAuth URL generation |
| Invalid state format | State decode failed | Verify base64 encoding |
| State expired | Timestamp too old | User must retry connection |
| Invalid user ID | USER_ID not UUID | Check Supabase Auth user ID |
| Database error | Connection insert failed | Check RLS policies and table permissions |

## RLS Policy Verification

Ensure Row Level Security policies exist:

```sql
-- Users can only see their own connections
CREATE POLICY "Users can view own meta connection"
  ON meta_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only update their own connections
CREATE POLICY "Users can update own meta connection"
  ON meta_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only insert their own connections
CREATE POLICY "Users can insert own meta connection"
  ON meta_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

## Webhook Logs

Monitor your n8n webhook execution logs for:
- Successful state decoding
- Token exchange responses
- Database upsert results
- Error messages

Console logs in the application will show:
```
[OAuth State] Generated state for user: 42285edd...
[OAuth URL] Generated OAuth URL with state for user: 42285edd...
[MetaConnection] Initiating OAuth for user: 42285edd...
```

After callback, dashboard logs will show:
```
[MetaConnection] Error checking connection: [any errors]
```

## Support

If connection fails:
1. Check browser console for logs starting with `[OAuth State]` or `[MetaConnection]`
2. Verify n8n webhook received the request (check execution history)
3. Verify state parameter was decoded correctly
4. Check Supabase `meta_connections` table for the entry
5. Verify RLS policies allow the user to read their connection
