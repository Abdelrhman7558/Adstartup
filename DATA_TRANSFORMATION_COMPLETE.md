# نظام معالجة بيانات الحملات الإعلانية - التوثيق الشامل

## نظرة عامة

تم تحديث نظام معالجة البيانات بالكامل لضمان:
- تحويل تلقائي لجميع القيم `null` و `undefined` إلى `"-"`
- حساب جميع المقاييس الأساسية (CTR, Conversion Rate, Avg CPC, Avg ROAS)
- توليد تقارير شاملة جاهزة للعرض مباشرة في الداشبورد
- تسجيل تفصيلي لكل خطوة من خطوات المعالجة

---

## المكونات الرئيسية

### 1. dataTransformer.ts - محول البيانات الأساسي

**الدوال الرئيسية:**

#### `transformN8NAdData(rawData: any): NormalizedAdData[]`
تحويل بيانات خام من n8n إلى بيانات موحدة ومنسقة.

```typescript
// مثال الإدخال
const rawData = [
  {
    id: "123",
    name: "Campaign 1",
    impressions: "1000",
    clicks: "50",
    spend: "100",
    conversions: "10",
    revenue: "500"
  }
];

// مثال المخرجات
const normalized = transformN8NAdData(rawData);
// النتيجة:
// {
//   id: "123",
//   name: "Campaign 1",
//   impressions: 1000,
//   clicks: 50,
//   spend: 100,
//   ctr: 5,  // محسوبة: (50 / 1000) * 100
//   cpc: 2,  // محسوبة: 100 / 50
//   cpm: 100, // محسوبة: (100 / 1000) * 1000
//   conversions: 10,
//   revenue: 500,
//   ...
// }
```

#### `calculateDashboardInsights(ads: NormalizedAdData[]): DashboardInsights`
حساب المقاييس الإجمالية للداشبورد.

```typescript
const insights = calculateDashboardInsights(normalizedAds);
// النتيجة:
// {
//   click_through_rate: 5.2,  // إجمالي CTR
//   conversion_rate: 20,       // إجمالي Conversion Rate
//   avg_cost_per_click: 2.5,   // متوسط تكلفة النقرة
//   avg_roas: 5                // متوسط العائد على الإنفاق الإعلاني
// }
```

#### `getTopCampaigns(ads: NormalizedAdData[], limit: number = 5): ProcessedCampaign[]`
الحصول على أفضل الحملات من حيث الإيرادات.

```typescript
const topCampaigns = getTopCampaigns(normalizedAds, 5);
// النتيجة:
// [
//   {
//     id: "123",
//     name: "Campaign 1",
//     revenue: 500,
//     spend: 100,
//     roas: 5,
//     status: "ACTIVE"
//   },
//   ...
// ]
```

#### `getRecentCampaigns(ads: NormalizedAdData[], limit: number = 10): Array<any>`
الحصول على أحدث الحملات.

```typescript
const recentCampaigns = getRecentCampaigns(normalizedAds, 10);
// النتيجة:
// [
//   {
//     id: "123",
//     name: "Campaign 1",
//     status: "ACTIVE",
//     created_at: "2025-01-01",
//     budget: 100
//   },
//   ...
// ]
```

---

### 2. n8nWebhookService.ts - خدمة الـ Webhook

**الدوال الرئيسية:**

#### `triggerN8NWebhook(userId: string): Promise<N8NWebhookResponse>`
تشغيل webhook من n8n واستقبال بيانات الحملات.

```typescript
// استدعاء Webhook
const result = await triggerN8NWebhook(userId);

// console.logs المتوقعة:
// [n8n Webhook] Triggering webhook for user: <user-id>
// [n8n Webhook] Sending payload: {"user_id":"<user-id>"}
// [n8n Webhook] Received response: {...}
// [Data Transformer] Starting transformation of raw data
// [Data Transformer] Normalizing ad data array length: 5
// [Data Transformer] Processing ad 1: Campaign Name
// [Data Transformer] Calculating dashboard insights
// [n8n Webhook] Response processed successfully with all metrics calculated
// [n8n Webhook] Processed dashboard data: {...}
```

---

## بنية البيانات الكاملة للمخرجات

### N8NWebhookResponse (المخرجات النهائية)

```typescript
{
  // البيانات المجمعة
  top_5_campaigns: [
    {
      id: string,
      name: string,
      revenue: number | "-",
      spend: number | "-",
      roas: number | "-",
      status: string
    }
  ],

  total_sales: number | "-",           // إجمالي المبيعات
  total_campaigns: number | "-",       // عدد الحملات
  active_ads: number | "-",            // عدد الإعلانات النشطة
  total_spend: number | "-",           // إجمالي الإنفاق
  total_revenue: number | "-",         // إجمالي الإيرادات

  recent_campaigns: [
    {
      id: string,
      name: string,
      status: string,
      created_at: string,
      budget: number | "-"
    }
  ],

  ads: [
    {
      id: string,
      name: string,
      status: string,
      objective: string,
      impressions: number | "-",
      clicks: number | "-",
      spend: number | "-",
      ctr: number | "-",               // نسبة النقر
      cpm: number | "-",               // تكلفة الألف انطباع
      cpc: number | "-",               // تكلفة النقرة
      reach: number | "-",
      frequency: number | "-",
      date_start: string,
      date_stop: string,
      conversions: number | "-",
      revenue: number | "-"
    }
  ],

  insights: {
    click_through_rate: number | "-",    // CTR محسوبة
    conversion_rate: number | "-",       // معدل التحويل
    avg_cost_per_click: number | "-",    // متوسط تكلفة النقرة
    avg_roas: number | "-"               // متوسط ROAS
  }
}
```

---

## عملية المعالجة خطوة بخطوة

### 1. الاستدعاء (Trigger)
```
[n8n Webhook] Triggering webhook for user: 123e4567-e89b-12d3-a456-426614174000
```

### 2. إرسال البيانات (Sending)
```
[n8n Webhook] Sending payload: {"user_id":"123e4567-e89b-12d3-a456-426614174000"}
```

### 3. استقبال الاستجابة (Receiving)
```
[n8n Webhook] Received response: {
  "ads": [
    {"id": "123", "name": "Campaign 1", "impressions": "1000", ...}
  ]
}
```

### 4. تحويل البيانات (Data Transformation)
```
[Data Transformer] Starting transformation of raw data
[Data Transformer] Normalizing ad data array length: 5
[Data Transformer] Processing ad 1: Campaign 1
[Data Transformer] Processing ad 2: Campaign 2
```

### 5. حساب المقاييس (Metrics Calculation)
```
[Data Transformer] Calculating dashboard insights
[Data Transformer] Totals - Impressions: 5000 Clicks: 250 Spend: 500 Conversions: 50 Revenue: 2500
[Data Transformer] Calculated metrics - CTR: 5 Conv Rate: 20 Avg CPC: 2 Avg ROAS: 5
```

### 6. استخراج التقارير (Reports Extraction)
```
[Data Transformer] Extracting top 5 campaigns by revenue
[Data Transformer] Top campaigns extracted: 5
[Data Transformer] Extracting recent 10 campaigns
[Data Transformer] Recent campaigns extracted: 5
```

### 7. المخرجات النهائية (Final Output)
```
[n8n Webhook] Processed dashboard data: {
  "top_5_campaigns": [...],
  "total_sales": 50,
  "total_campaigns": 5,
  "active_ads": 4,
  "total_spend": 500,
  "total_revenue": 2500,
  "recent_campaigns": [...],
  "ads": [...],
  "insights": {...}
}
```

---

## معالجة القيم الفارغة والخاطئة

### تحويل null و undefined

**قبل الآن:**
```typescript
null → 0
undefined → 0
"" → 0
```

**الآن (محدث):**
```typescript
null → "-"
undefined → "-"
"" → "-"
```

### أمثلة على المعالجة

| المدخل | المخرجات |
|-------|---------|
| null | "-" |
| undefined | "-" |
| "" | "-" |
| "1000" | 1000 |
| "abc" | "-" |
| 0 | "-" |
| 1000 | 1000 |

---

## المقاييس المحسوبة تلقائياً

### 1. Click-Through Rate (CTR)
```
CTR = (totalClicks / totalImpressions) * 100
مثال: (250 / 5000) * 100 = 5%
```

### 2. Conversion Rate
```
ConversionRate = (totalConversions / totalClicks) * 100
مثال: (50 / 250) * 100 = 20%
```

### 3. Average Cost Per Click (CPC)
```
AvgCPC = totalSpend / totalClicks
مثال: 500 / 250 = 2
```

### 4. Average ROAS (Return on Ad Spend)
```
AvgROAS = totalRevenue / totalSpend
مثال: 2500 / 500 = 5
```

### 5. Cost Per Mille (CPM)
```
CPM = (spend / impressions) * 1000
مثال: (500 / 5000) * 1000 = 100
```

---

## استخدام البيانات في الداشبورد

### مثال على الاستخدام في المكون

```typescript
import { triggerN8NWebhook } from '@/lib/n8nWebhookService';
import { useEffect, useState } from 'react';

export function DashboardComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = user?.id;

    (async () => {
      try {
        const dashboardData = await triggerN8NWebhook(userId);

        // dashboardData يحتوي على كل المعلومات:
        console.log('Top 5 Campaigns:', dashboardData.top_5_campaigns);
        console.log('Total Revenue:', dashboardData.total_revenue);
        console.log('Insights:', dashboardData.insights);
        console.log('All Ads:', dashboardData.ads);

        setData(dashboardData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // العرض باستخدام البيانات
  return (
    <div>
      <h2>Total Revenue: {data?.total_revenue}</h2>
      <h2>CTR: {data?.insights.click_through_rate}%</h2>
      <table>
        {data?.ads.map(ad => (
          <tr key={ad.id}>
            <td>{ad.name}</td>
            <td>{ad.impressions}</td>
            <td>{ad.clicks}</td>
            <td>{ad.ctr}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}
```

---

## التحقق والتصحيح

### التحقق من البيانات

```typescript
import { validateNormalizedData } from '@/lib/dataTransformer';

const isValid = validateNormalizedData(data);
console.log('Data is valid:', isValid);
```

### مراقبة console logs

يمكنك فتح Developer Tools (F12) والذهاب إلى Console tab لرؤية جميع الخطوات:

```
[n8n Webhook] Triggering webhook for user: ...
[n8n Webhook] Sending payload: ...
[n8n Webhook] Received response: ...
[Data Transformer] Starting transformation of raw data
[Data Transformer] Normalizing ad data array length: ...
[Data Transformer] Processing ad 1: ...
...
[n8n Webhook] Processed dashboard data: ...
```

---

## الملفات المحدثة

| الملف | التحديثات |
|------|-----------|
| `src/lib/dataTransformer.ts` | إضافة حساب المقاييس، null → "-"، interfaces جديدة |
| `src/lib/n8nWebhookService.ts` | دمج المحول، console logs محسنة، المخرجات الكاملة |
| `src/lib/dashboardDataService.ts` | تحديث الأنواع للتوافق الكامل |

---

## ملاحظات مهمة

1. **أي قيمة null تصبح "-"** - لا توجد قيم فارغة في المخرجات
2. **كل المقاييس محسوبة تلقائياً** - لا تحتاج إلى حساب يدوي
3. **جميع الـ Arrays لن تكون null** - يتم إرجاع arrays فارغة بدلاً من null
4. **console.logs واضحة** - متابعة سهلة لجميع خطوات المعالجة
5. **جاهز للعرض مباشرة** - البيانات النهائية صالحة للاستخدام مباشرة في الداشبورد

---

## الخطوات التالية

إذا كنت تريد:
- تخزين البيانات في Supabase بعد المعالجة
- إرسال تنبيهات عند تغير المقاييس الهامة
- تحديث فترات زمنية محددة

فقط أخبرني وسأضيف هذه الميزات!
