# Meta Selection API Reference

Quick reference for all Meta Selection API endpoints.

## Base URLs

**Supabase Edge Functions**: `https://[YOUR_SUPABASE_URL]/functions/v1`
**n8n Alternative**: `https://n8n.srv1181726.hstgr.cloud/webhook`

---

## Endpoints

### 1. Get Ad Accounts

Fetch all Ad Accounts for authenticated user.

**Supabase Edge Function**:
```
GET https://[SUPABASE_URL]/functions/v1/get-ad-accounts
```

**n8n Alternative**:
```
GET https://n8n.example.com/webhook/meta-ad-accounts?user_id={userId}
```

**Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Response (200)**:
```json
{
  "data": [
    {
      "id": "act_123456789",
      "name": "My Ad Account",
      "currency": "USD",
      "account_status": 1
    }
  ]
}
```

**Error (404)**:
```json
{
  "error": "No Meta connection found"
}
```

---

### 2. Get Pixels

Fetch Pixels for selected Ad Account.

**Supabase Edge Function**:
```
GET https://[SUPABASE_URL]/functions/v1/get-pixels?ad_account_id=act_123456789
```

**n8n Alternative**:
```
GET https://n8n.example.com/webhook/meta-pixels?user_id={userId}&ad_account_id=act_123456789
```

**Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Query Parameters**:
- `ad_account_id` (required): The Ad Account ID

**Response (200)**:
```json
{
  "data": [
    {
      "id": "123456789",
      "name": "My Pixel",
      "last_fired_time": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Error (400)**:
```json
{
  "error": "Missing ad_account_id parameter"
}
```

---

### 3. Get Catalogs

Fetch Product Catalogs for authenticated user.

**Supabase Edge Function**:
```
GET https://[SUPABASE_URL]/functions/v1/get-catalogs
```

**n8n Alternative**:
```
GET https://n8n.example.com/webhook/meta-catalogs?user_id={userId}
```

**Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Response (200)**:
```json
{
  "data": [
    {
      "id": "123456789",
      "name": "My Product Catalog",
      "product_count": 150
    }
  ]
}
```

**Empty Response (200)**:
```json
{
  "data": []
}
```

---

### 4. Save Meta Selections

Save user's selected Ad Account, Pixel, and Catalog.

**Supabase Edge Function**:
```
POST https://[SUPABASE_URL]/functions/v1/save-meta-selections
```

**n8n Alternative**:
```
POST https://n8n.example.com/webhook/meta-save
```

**Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Body**:
```json
{
  "brief_id": "uuid-optional",
  "ad_account_id": "act_123456789",
  "ad_account_name": "My Ad Account",
  "pixel_id": "123456789",
  "pixel_name": "My Pixel",
  "catalog_id": "123456789",
  "catalog_name": "My Catalog"
}
```

**Required Fields**:
- `ad_account_id`
- `ad_account_name`
- `pixel_id`
- `pixel_name`

**Optional Fields**:
- `brief_id`
- `catalog_id`
- `catalog_name`

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "brief_id": "uuid",
    "ad_account_id": "act_123456789",
    "pixel_id": "123456789",
    "catalog_id": "123456789",
    "selection_completed": true,
    "webhook_submitted": true
  }
}
```

**Error (400)**:
```json
{
  "error": "Missing required fields: brief_id and ad_account_id"
}
```

**Error (404)**:
```json
{
  "error": "Brief not found"
}
```

**Side Effects**:
1. Saves to `meta_account_selections` table
2. Fetches brief data if `brief_id` provided
3. Sends webhook to n8n:
   ```
   POST https://n8n.srv1181726.hstgr.cloud/webhook-test/Collect-All-Account
   ```
4. Updates `webhook_submitted` and `webhook_response` in database

---

## Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Missing parameters, invalid format |
| 401 | Unauthorized | No JWT token, invalid token, expired session |
| 404 | Not Found | No Meta connection, brief not found |
| 500 | Server Error | Meta API failure, database error |

---

## Common Error Messages

**"Missing Authorization header"**
- Cause: No JWT token provided
- Fix: Include `Authorization: Bearer {token}` header

**"Invalid authorization token"**
- Cause: Token expired or invalid
- Fix: Refresh session, get new token

**"No Meta connection found"**
- Cause: User hasn't completed OAuth flow
- Fix: User must connect Meta account first

**"Missing ad_account_id parameter"**
- Cause: Required parameter not provided
- Fix: Add query parameter `?ad_account_id=act_xxx`

**"Brief not found"**
- Cause: Invalid brief_id or user doesn't own brief
- Fix: Verify brief exists and belongs to user

---

## Frontend Integration

### Using Fetch API

```typescript
const fetchAdAccounts = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-ad-accounts`,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const result = await response.json();
  return result.data;
};
```

### Using Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`,
});

// Add auth interceptor
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  config.headers.Authorization = `Bearer ${session.access_token}`;
  return config;
});

// Use it
const { data } = await api.get('/get-ad-accounts');
const adAccounts = data.data;
```

---

## Testing with cURL

### Get Ad Accounts
```bash
curl -X GET \
  'https://[SUPABASE_URL]/functions/v1/get-ad-accounts' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json'
```

### Get Pixels
```bash
curl -X GET \
  'https://[SUPABASE_URL]/functions/v1/get-pixels?ad_account_id=act_123456789' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json'
```

### Get Catalogs
```bash
curl -X GET \
  'https://[SUPABASE_URL]/functions/v1/get-catalogs' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json'
```

### Save Selections
```bash
curl -X POST \
  'https://[SUPABASE_URL]/functions/v1/save-meta-selections' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "brief_id": "uuid",
    "ad_account_id": "act_123456789",
    "ad_account_name": "My Ad Account",
    "pixel_id": "123456789",
    "pixel_name": "My Pixel"
  }'
```

---

## Rate Limits

**Supabase Edge Functions**: No hard limits, but recommended max 100 requests/minute per user

**Meta Graph API**:
- 200 calls per hour per user
- 4800 calls per hour per app

---

## Security Notes

1. **NEVER** expose access tokens to frontend
2. **ALWAYS** validate JWT on server-side
3. **ALWAYS** use HTTPS for all requests
4. **NEVER** log access tokens
5. **ALWAYS** validate user ownership before returning data

---

## Monitoring

### Check Edge Function Logs
```bash
supabase functions logs get-ad-accounts
supabase functions logs get-pixels
supabase functions logs get-catalogs
supabase functions logs save-meta-selections
```

### Common Issues

**High error rate on get-ad-accounts**:
- Check Meta access tokens haven't expired
- Verify users have completed OAuth

**Slow response times**:
- Check Meta Graph API status
- Verify database indexes
- Consider caching frequently accessed data

**Webhook failures**:
- Check n8n webhook URL is correct
- Verify n8n workflow is active
- Check webhook logs in database

---

**Version**: 1.0
**Last Updated**: 2025-12-21
