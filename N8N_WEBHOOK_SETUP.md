# n8n Webhook Setup Guide for Meta Asset Selection

This guide explains how to set up secure n8n webhooks to handle Meta Marketing API calls without exposing access tokens to the frontend.

## Overview

The frontend (`/meta/select` page) calls n8n webhooks which:
1. Retrieve the user's stored access token from Supabase
2. Make secure API calls to Meta's Graph API
3. Return data to the frontend without exposing tokens

## Required Webhooks

You need to create 3 webhooks in n8n:

### 1. Meta-Ad-Accounts Webhook

**Purpose:** Fetch all ad accounts for a user

**URL Pattern:**
```
https://n8n.srv1181726.hstgr.cloud/webhook-test/Meta-Ad-Accounts?user_id=XXX
```

**Request:**
- Method: `GET`
- Query Parameters: `user_id` (Supabase user ID)

**Response:**
```json
{
  "data": [
    {
      "id": "act_1234567890",
      "name": "My Ad Account"
    },
    {
      "id": "act_0987654321",
      "name": "Another Ad Account"
    }
  ]
}
```

**n8n Workflow Steps:**

1. **Webhook Trigger**
   - Listen for GET requests
   - URL: `/Meta-Ad-Accounts`

2. **Extract user_id from query**
   - Use expression: `$query.user_id`

3. **Query Supabase**
   - Table: `meta_account_selections`
   - Filter: `user_id = {{user_id}}`
   - Select: `access_token`

4. **Call Meta Graph API**
   - URL: `https://graph.instagram.com/v19.0/me/adaccounts`
   - Method: `GET`
   - Query Parameters: `access_token={{access_token}}`
   - Fields: `id,name`

5. **Transform Response**
   ```javascript
   {
     data: $json.data.map(account => ({
       id: account.id,
       name: account.name
     }))
   }
   ```

6. **Return Response**
   - Status Code: 200
   - Body: Response from step 5

---

### 2. Meta-Pixels Webhook

**Purpose:** Fetch tracking pixels for a selected ad account

**URL Pattern:**
```
https://n8n.srv1181726.hstgr.cloud/webhook-test/Meta-Pixels?user_id=XXX&ad_account_id=YYY
```

**Request:**
- Method: `GET`
- Query Parameters:
  - `user_id` (Supabase user ID)
  - `ad_account_id` (Meta ad account ID)

**Response:**
```json
{
  "data": [
    {
      "id": "1234567890",
      "name": "My Website Pixel"
    },
    {
      "id": "0987654321",
      "name": "Store Pixel"
    }
  ]
}
```

**n8n Workflow Steps:**

1. **Webhook Trigger**
   - Listen for GET requests
   - URL: `/Meta-Pixels`

2. **Extract Parameters**
   - `user_id`: `$query.user_id`
   - `ad_account_id`: `$query.ad_account_id`

3. **Query Supabase for access_token**
   - Table: `meta_account_selections`
   - Filter: `user_id = {{user_id}}`
   - Select: `access_token`

4. **Call Meta Graph API**
   - URL: `https://graph.instagram.com/v19.0/{{ad_account_id}}/owned_pixels`
   - Method: `GET`
   - Query Parameters: `access_token={{access_token}}`
   - Fields: `id,name`

5. **Transform Response**
   ```javascript
   {
     data: $json.data.map(pixel => ({
       id: pixel.id,
       name: pixel.name
     }))
   }
   ```

6. **Return Response**
   - Status Code: 200
   - Body: Response from step 5

---

### 3. Meta-Catalogs Webhook

**Purpose:** Fetch product catalogs for a user

**URL Pattern:**
```
https://n8n.srv1181726.hstgr.cloud/webhook-test/Meta-Catalogs?user_id=XXX
```

**Request:**
- Method: `GET`
- Query Parameters: `user_id` (Supabase user ID)

**Response:**
```json
{
  "data": [
    {
      "id": "catalog_123",
      "name": "My Product Catalog"
    },
    {
      "id": "catalog_456",
      "name": "Backup Catalog"
    }
  ]
}
```

**n8n Workflow Steps:**

1. **Webhook Trigger**
   - Listen for GET requests
   - URL: `/Meta-Catalogs`

2. **Extract user_id from query**
   - Use expression: `$query.user_id`

3. **Query Supabase for business_id and access_token**
   - Table: `meta_account_selections`
   - Filter: `user_id = {{user_id}}`
   - Select: `business_id, access_token`

4. **Call Meta Graph API**
   - URL: `https://graph.instagram.com/v19.0/{{business_id}}/owned_product_catalogs`
   - Method: `GET`
   - Query Parameters: `access_token={{access_token}}`
   - Fields: `id,name`

5. **Transform Response**
   ```javascript
   {
     data: $json.data.map(catalog => ({
       id: catalog.id,
       name: catalog.name
     }))
   }
   ```

6. **Return Response**
   - Status Code: 200
   - Body: Response from step 5

---

## Security Considerations

### Access Token Storage & Retrieval
- **Never** expose access tokens in response bodies
- **Always** retrieve tokens from Supabase using the `user_id`
- Token is used server-side only and not returned to frontend

### CORS Headers
All webhooks should include these headers in responses:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Error Handling

**401 Unauthorized** (Token Expired)
```json
{
  "error": "token_expired",
  "message": "Your Meta session has expired. Please reconnect your account.",
  "status": 401
}
```

**403 Forbidden** (Permission Issue)
```json
{
  "error": "permission_denied",
  "message": "You do not have permission to access this resource.",
  "status": 403
}
```

**404 Not Found** (User Not Found)
```json
{
  "error": "user_not_found",
  "message": "User configuration not found.",
  "status": 404
}
```

**500 Server Error** (Meta API Error)
```json
{
  "error": "meta_api_error",
  "message": "Failed to fetch from Meta. Please try again later.",
  "status": 500
}
```

---

## n8n Node Configuration Example

### Supabase Node (PostgreSQL)

```
Type: n8n Postgres Connector
Host: [Your Supabase Host]
Database: postgres
User: postgres
Password: [Your Supabase Password]
SSL: true

Query:
SELECT access_token, business_id
FROM meta_account_selections
WHERE user_id = '{{$query.user_id}}'
LIMIT 1
```

### HTTP Request Node (Meta API)

```
Method: GET
URL: https://graph.instagram.com/v19.0/me/adaccounts
Query Parameters:
  - access_token: {{$node.Supabase.json.access_token}}
  - fields: id,name
Headers:
  - Content-Type: application/json
```

---

## Testing the Webhooks

### Test Meta-Ad-Accounts

```bash
curl -X GET "https://n8n.srv1181726.hstgr.cloud/webhook-test/Meta-Ad-Accounts?user_id=USER_ID"
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": "act_1234567890",
      "name": "My Ad Account"
    }
  ]
}
```

### Test Meta-Pixels

```bash
curl -X GET "https://n8n.srv1181726.hstgr.cloud/webhook-test/Meta-Pixels?user_id=USER_ID&ad_account_id=act_1234567890"
```

### Test Meta-Catalogs

```bash
curl -X GET "https://n8n.srv1181726.hstgr.cloud/webhook-test/Meta-Catalogs?user_id=USER_ID"
```

---

## Environment Variables

Add to your `.env` file:
```
VITE_N8N_WEBHOOK_BASE=https://n8n.srv1181726.hstgr.cloud/webhook-test
```

The frontend will use this to construct webhook URLs:
```javascript
const N8N_WEBHOOK_BASE = import.meta.env.VITE_N8N_WEBHOOK_BASE || 'https://n8n.srv1181726.hstgr.cloud/webhook-test';
```

---

## Data Flow Diagram

```
Frontend (/meta/select)
    |
    | GET /Meta-Ad-Accounts?user_id=...
    ↓
n8n Webhook
    |
    ├→ Query Supabase for access_token
    |
    ├→ Call Meta Graph API with token
    |
    ├→ Transform response
    |
    └→ Return { data: [...] }
```

---

## Migration Notes

The system now works as follows:

1. **OAuth Callback** (`/meta-callback`)
   - User authenticates with Meta
   - Access token stored in Supabase
   - Redirects to `/meta-select?user_id=USER_ID`

2. **Asset Selection** (`/meta-select`)
   - Receives `user_id` from query parameter
   - Calls n8n webhooks (NOT direct Meta API)
   - n8n webhooks use stored access token from Supabase
   - Frontend never sees the access token

3. **Confirmation**
   - Saves selections to `meta_account_selections` table
   - Redirects to `/dashboard`

This ensures all Meta API calls are server-side and secure.
