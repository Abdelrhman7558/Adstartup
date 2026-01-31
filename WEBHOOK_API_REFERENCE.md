# Webhook API Reference

## Endpoint

```
POST https://n8n.srv1181726.hstgr.cloud/webhook-test/other-data
```

## Request

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "user_id": "12345678-1234-1234-1234-123456789012"
}
```

**Note:** `user_id` is extracted from the authenticated Supabase session.

---

## Response

### Success (200 OK)

```json
{
  "top_5_campaigns": [
    {
      "id": "camp_001",
      "name": "Summer Sale Campaign",
      "spend": 5000,
      "revenue": 15000,
      "roas": 3,
      "status": "ACTIVE"
    },
    {
      "id": "camp_002",
      "name": "Black Friday Promo",
      "spend": 3000,
      "revenue": 12000,
      "roas": 4,
      "status": "ACTIVE"
    }
  ],

  "sales_trend": [
    {
      "date": "2025-01-01",
      "sales": 5000
    },
    {
      "date": "2025-01-02",
      "sales": 6500
    },
    {
      "date": "2025-01-03",
      "sales": 4800
    }
  ],

  "recent_campaigns": [
    {
      "id": "camp_003",
      "name": "Holiday Special",
      "status": "ACTIVE",
      "created_at": "2025-01-01T10:00:00Z"
    },
    {
      "id": "camp_004",
      "name": "New Year Deal",
      "status": "PAUSED",
      "created_at": "2025-01-02T14:30:00Z"
    }
  ],

  "ads": [
    {
      "id": "ad_001",
      "name": "Homepage Banner",
      "status": "ACTIVE",
      "impressions": 50000,
      "clicks": 2500,
      "spend": 1000
    },
    {
      "id": "ad_002",
      "name": "Sidebar Promo",
      "status": "ACTIVE",
      "impressions": 30000,
      "clicks": 1200,
      "spend": 600
    }
  ]
}
```

---

## Field Descriptions

### top_5_campaigns

| Field | Type | Description |
|-------|------|-------------|
| id | string | Campaign identifier |
| name | string | Campaign display name |
| spend | number | Total amount spent on campaign |
| revenue | number | Total revenue generated |
| roas | number | Return on ad spend (revenue/spend) |
| status | string | Campaign status (ACTIVE, PAUSED, etc.) |

### sales_trend

| Field | Type | Description |
|-------|------|-------------|
| date | string | Date in YYYY-MM-DD format |
| sales | number | Sales amount for that date |

### recent_campaigns

| Field | Type | Description |
|-------|------|-------------|
| id | string | Campaign identifier |
| name | string | Campaign display name |
| status | string | Campaign status |
| created_at | string | ISO-8601 timestamp |

### ads

| Field | Type | Description |
|-------|------|-------------|
| id | string | Ad identifier |
| name | string | Ad display name |
| status | string | Ad status (ACTIVE, PAUSED, etc.) |
| impressions | number | Number of ad impressions |
| clicks | number | Number of ad clicks |
| spend | number | Amount spent on ad |

---

## Error Handling

### Missing user_id
```
Status: 400
Response: {"error": "user_id is required"}
```

### Server Error
```
Status: 500
Response: {"error": "Internal server error"}
```

---

## Response Validation Rules

The dashboard expects:

✅ All arrays can be empty
✅ Top-level fields can be null (not rendered)
✅ Arrays render if they have 1+ items
✅ Missing fields are treated as null

Example (partial response is valid):
```json
{
  "top_5_campaigns": [],
  "sales_trend": [
    {"date": "2025-01-01", "sales": 1000}
  ]
}
```

This would render:
- ❌ Top 5 campaigns (empty)
- ✅ Sales trend (has data)
- ❌ Recent campaigns (missing)
- ❌ Ads (missing)

---

## Dashboard Display Mapping

| Response Field | Display Component | Condition |
|----------------|------------------|-----------|
| top_5_campaigns | Campaign Table | Array length > 0 |
| sales_trend | Bar Chart | Array length > 0 |
| recent_campaigns | Campaign List | Array length > 0 |
| ads | Ads Table | Array length > 0 |

---

## Implementation Notes

- **Single Request:** Dashboard makes exactly 1 request on load
- **No Polling:** Data does not auto-refresh
- **No Caching:** Each page load makes a fresh request
- **User-Specific:** user_id ensures data is personalized
- **No Transformation:** Data displayed exactly as received

---

## Debugging

Enable browser console (F12) to see:

```
[Dashboard] Sending POST request to n8n webhook
[Dashboard] Webhook response received
```

Check the Network tab:
1. Look for the POST request to the webhook URL
2. Inspect the Response tab to see raw JSON
3. Verify all expected fields are present

---

**API Version:** 1.0
**Last Updated:** January 2025
