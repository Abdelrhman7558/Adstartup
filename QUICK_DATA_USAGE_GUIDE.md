# دليل الاستخدام السريع - نظام معالجة بيانات الحملات

## البدء السريع

### 1. استدعاء البيانات من الداشبورد

```typescript
import { triggerN8NWebhook } from '@/lib/n8nWebhookService';

// في داخل مكون React
const userId = user.id;
const dashboardData = await triggerN8NWebhook(userId);
```

### 2. الوصول إلى البيانات المختلفة

```typescript
// المقاييس الإجمالية
console.log(dashboardData.total_revenue);    // إجمالي الإيرادات
console.log(dashboardData.total_spend);      // إجمالي الإنفاق
console.log(dashboardData.total_sales);      // إجمالي المبيعات
console.log(dashboardData.active_ads);       // الإعلانات النشطة

// المقاييس الرئيسية
console.log(dashboardData.insights.click_through_rate);      // CTR
console.log(dashboardData.insights.conversion_rate);         // معدل التحويل
console.log(dashboardData.insights.avg_cost_per_click);      // متوسط CPC
console.log(dashboardData.insights.avg_roas);                // متوسط ROAS

// أفضل الحملات
dashboardData.top_5_campaigns.forEach(campaign => {
  console.log(`${campaign.name}: ${campaign.revenue} إيرادات`);
});

// أحدث الحملات
dashboardData.recent_campaigns.forEach(campaign => {
  console.log(`${campaign.name}: ${campaign.status}`);
});

// تفاصيل كل إعلان
dashboardData.ads.forEach(ad => {
  console.log({
    name: ad.name,
    impressions: ad.impressions,
    clicks: ad.clicks,
    ctr: ad.ctr,
    revenue: ad.revenue,
    spend: ad.spend
  });
});
```

---

## أمثلة عملية

### عرض أفضل 5 حملات

```typescript
function TopCampaigns({ data }) {
  return (
    <div>
      <h2>أفضل 5 حملات</h2>
      <table>
        <thead>
          <tr>
            <th>اسم الحملة</th>
            <th>الإيرادات</th>
            <th>الإنفاق</th>
            <th>ROAS</th>
          </tr>
        </thead>
        <tbody>
          {data.top_5_campaigns.map(campaign => (
            <tr key={campaign.id}>
              <td>{campaign.name}</td>
              <td>${campaign.revenue}</td>
              <td>${campaign.spend}</td>
              <td>{campaign.roas}x</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### عرض المقاييس الرئيسية

```typescript
function KeyMetrics({ data }) {
  return (
    <div className="metrics-grid">
      <MetricCard
        title="إجمالي الإيرادات"
        value={data.total_revenue}
        prefix="$"
      />
      <MetricCard
        title="إجمالي الإنفاق"
        value={data.total_spend}
        prefix="$"
      />
      <MetricCard
        title="CTR"
        value={data.insights.click_through_rate}
        suffix="%"
      />
      <MetricCard
        title="معدل التحويل"
        value={data.insights.conversion_rate}
        suffix="%"
      />
      <MetricCard
        title="متوسط ROAS"
        value={data.insights.avg_roas}
        suffix="x"
      />
    </div>
  );
}
```

### جدول الإعلانات المفصل

```typescript
function AdsTable({ data }) {
  return (
    <table className="ads-table">
      <thead>
        <tr>
          <th>الاسم</th>
          <th>الانطباعات</th>
          <th>النقرات</th>
          <th>CTR</th>
          <th>الإنفاق</th>
          <th>الإيرادات</th>
          <th>ROAS</th>
        </tr>
      </thead>
      <tbody>
        {data.ads.map(ad => {
          const roas = (ad.revenue / ad.spend);
          return (
            <tr key={ad.id}>
              <td>{ad.name}</td>
              <td>{ad.impressions}</td>
              <td>{ad.clicks}</td>
              <td>{ad.ctr}%</td>
              <td>${ad.spend}</td>
              <td>${ad.revenue}</td>
              <td>{roas}x</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

---

## معالجة الأخطاء

```typescript
async function safeFetchDashboardData(userId) {
  try {
    const data = await triggerN8NWebhook(userId);

    // التحقق من البيانات
    if (!data.ads || data.ads.length === 0) {
      console.warn('No ads data available');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);

    // إرجاع بيانات افتراضية آمنة
    return {
      total_revenue: '-',
      total_spend: '-',
      total_sales: '-',
      active_ads: '-',
      total_campaigns: '-',
      ads: [],
      top_5_campaigns: [],
      recent_campaigns: [],
      insights: {
        click_through_rate: '-',
        conversion_rate: '-',
        avg_cost_per_click: '-',
        avg_roas: '-'
      }
    };
  }
}
```

---

## تحقق من Console Logs

عند استدعاء البيانات، يجب أن ترى في Developer Console:

```
[n8n Webhook] Triggering webhook for user: 123e4567-e89b-12d3-a456-426614174000
[n8n Webhook] Sending payload: {"user_id":"123e4567-e89b-12d3-a456-426614174000"}
[n8n Webhook] Received response: {...}
[Data Transformer] Starting transformation of raw data
[Data Transformer] Normalizing ad data array length: 5
[Data Transformer] Processing ad 1: Campaign 1
[Data Transformer] Processing ad 2: Campaign 2
[Data Transformer] Processing ad 3: Campaign 3
[Data Transformer] Processing ad 4: Campaign 4
[Data Transformer] Processing ad 5: Campaign 5
[Data Transformer] Calculating dashboard insights
[Data Transformer] Totals - Impressions: 10000 Clicks: 500 Spend: 1000 Conversions: 100 Revenue: 5000
[Data Transformer] Calculated metrics - CTR: 5 Conv Rate: 20 Avg CPC: 2 Avg ROAS: 5
[Data Transformer] Extracting top 5 campaigns by revenue
[Data Transformer] Top campaigns extracted: 5
[Data Transformer] Extracting recent 10 campaigns
[Data Transformer] Recent campaigns extracted: 5
[n8n Webhook] Response processed successfully with all metrics calculated
[n8n Webhook] Processed dashboard data: {...}
```

إذا رأيت هذه السجلات، فهذا يعني أن كل شيء يعمل بشكل صحيح!

---

## أسئلة شائعة

### س: ماذا لو كانت البيانات null؟
**ج:** سيتم تحويل null تلقائياً إلى "-" في المخرجات.

### س: كيف أحسب ROAS للحملة الواحدة؟
**ج:** `ROAS = campaign.revenue / campaign.spend`

### س: هل يمكن استخدام البيانات مباشرة في الرسوم البيانية؟
**ج:** نعم! البيانات جاهزة للاستخدام الفوري.

### س: ماذا لو فشل الـ webhook؟
**ج:** يتم رصد الخطأ في console والتعامل معه بشكل آمن.

### س: هل البيانات محدثة في الوقت الفعلي؟
**ج:** تُحدث عند استدعاء الدالة. يمكنك استدعاؤها بشكل دوري.

---

## ملخص سريع

| العملية | الدالة |
|--------|-------|
| استدعاء البيانات | `triggerN8NWebhook(userId)` |
| تحويل البيانات الخام | `transformN8NAdData(rawData)` |
| حساب المقاييس | `calculateDashboardInsights(ads)` |
| الحملات الأفضل | `getTopCampaigns(ads)` |
| الحملات الأحدث | `getRecentCampaigns(ads)` |

---

**ملاحظة:** كل القيم الفارغة سيتم تحويلها إلى "-" تلقائياً، لذا لا تقلق من عرض بيانات فارغة على الواجهة!
