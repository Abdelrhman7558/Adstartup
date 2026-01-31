# دليل اختبار نظام معالجة البيانات

## كيفية اختبار النظام الجديد

### الطريقة 1: اختبار مباشر في Browser Console

1. افتح الداشبورد في المتصفح
2. افتح Developer Tools (F12)
3. انتقل إلى Console tab
4. انسخ والصق الكود التالي:

```javascript
// استيراد الدوال (إذا كنت في مكون React)
import { triggerN8NWebhook } from '@/lib/n8nWebhookService';

// استدعاء الدالة
const userId = 'YOUR_USER_ID_HERE';
triggerN8NWebhook(userId)
  .then(data => {
    console.log('SUCCESS! Dashboard Data:', data);

    // عرض المقاييس الرئيسية
    console.group('KEY METRICS');
    console.log('Total Revenue:', data.total_revenue);
    console.log('Total Spend:', data.total_spend);
    console.log('Total Sales:', data.total_sales);
    console.log('Active Ads:', data.active_ads);
    console.groupEnd();

    // عرض الـ Insights
    console.group('INSIGHTS');
    console.log('CTR:', data.insights.click_through_rate);
    console.log('Conversion Rate:', data.insights.conversion_rate);
    console.log('Avg CPC:', data.insights.avg_cost_per_click);
    console.log('Avg ROAS:', data.insights.avg_roas);
    console.groupEnd();

    // عرض أفضل الحملات
    console.group('TOP 5 CAMPAIGNS');
    data.top_5_campaigns.forEach(c => {
      console.log(`${c.name}: $${c.revenue} revenue, $${c.spend} spend, ${c.roas}x ROAS`);
    });
    console.groupEnd();

    // عرض الإعلانات
    console.group('ALL ADS');
    console.table(data.ads);
    console.groupEnd();
  })
  .catch(error => {
    console.error('FAILED! Error:', error);
  });
```

---

### الطريقة 2: اختبار في مكون React

أنشئ مكون اختبار مؤقت:

```typescript
// TestDataTransformation.tsx
import { useEffect, useState } from 'react';
import { triggerN8NWebhook } from '@/lib/n8nWebhookService';

export function TestDataTransformation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userId = 'YOUR_USER_ID_HERE';

    (async () => {
      try {
        console.log('Starting test...');
        const result = await triggerN8NWebhook(userId);
        console.log('Result:', result);
        setData(result);
      } catch (err) {
        console.error('Test failed:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>جارٍ التحميل...</div>;
  if (error) return <div>خطأ: {error.message}</div>;
  if (!data) return <div>لا توجد بيانات</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>نتائج الاختبار</h1>

      <section>
        <h2>المقاييس الإجمالية</h2>
        <p>إجمالي الإيرادات: {data.total_revenue}</p>
        <p>إجمالي الإنفاق: {data.total_spend}</p>
        <p>إجمالي المبيعات: {data.total_sales}</p>
        <p>الإعلانات النشطة: {data.active_ads}</p>
      </section>

      <section>
        <h2>الرؤى والمقاييس</h2>
        <p>CTR: {data.insights.click_through_rate}</p>
        <p>معدل التحويل: {data.insights.conversion_rate}</p>
        <p>متوسط CPC: {data.insights.avg_cost_per_click}</p>
        <p>متوسط ROAS: {data.insights.avg_roas}</p>
      </section>

      <section>
        <h2>أفضل 5 حملات</h2>
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الإيرادات</th>
              <th>الإنفاق</th>
              <th>ROAS</th>
            </tr>
          </thead>
          <tbody>
            {data.top_5_campaigns.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.revenue}</td>
                <td>{c.spend}</td>
                <td>{c.roas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>جميع الإعلانات</h2>
        <pre>{JSON.stringify(data.ads, null, 2)}</pre>
      </section>
    </div>
  );
}
```

---

## قائمة التحقق من النتائج

عند تشغيل الاختبار، تأكد من:

### Console Logs ✓
- [ ] رؤية `[n8n Webhook] Triggering webhook for user:`
- [ ] رؤية `[n8n Webhook] Sending payload:`
- [ ] رؤية `[n8n Webhook] Received response:`
- [ ] رؤية `[Data Transformer] Starting transformation of raw data`
- [ ] رؤية `[Data Transformer] Normalizing ad data array length:`
- [ ] رؤية `[Data Transformer] Calculating dashboard insights`
- [ ] رؤية `[Data Transformer] Extracting top 5 campaigns by revenue`
- [ ] رؤية `[n8n Webhook] Response processed successfully`

### البيانات الإجمالية ✓
- [ ] `total_revenue` موجودة وليست null
- [ ] `total_spend` موجودة وليست null
- [ ] `total_sales` موجودة وليست null
- [ ] `active_ads` موجودة وليست null
- [ ] `total_campaigns` موجودة وليست null

### الـ Insights ✓
- [ ] `click_through_rate` موجودة (رقم أو "-")
- [ ] `conversion_rate` موجودة (رقم أو "-")
- [ ] `avg_cost_per_click` موجودة (رقم أو "-")
- [ ] `avg_roas` موجودة (رقم أو "-")

### الحملات ✓
- [ ] `top_5_campaigns` array موجود ولا يساوي null
- [ ] `recent_campaigns` array موجود ولا يساوي null
- [ ] كل حملة لها الحقول المطلوبة

### الإعلانات ✓
- [ ] `ads` array موجود ولا يساوي null
- [ ] كل إعلان لا يحتوي على null values
- [ ] جميع الأرقام محسوبة بشكل صحيح
- [ ] لا توجد أخطاء في الحسابات

### معالجة null ✓
- [ ] أي قيمة null تم تحويلها إلى "-"
- [ ] أي قيمة undefined تم تحويلها إلى "-"
- [ ] أي قيمة فارغة تم تحويلها إلى "-"

---

## أمثلة على النتائج المتوقعة

### مثال 1: بيانات مكتملة

```javascript
{
  total_revenue: 5000,
  total_spend: 1000,
  total_sales: 100,
  active_ads: 4,
  total_campaigns: 5,
  insights: {
    click_through_rate: 5.2,
    conversion_rate: 20,
    avg_cost_per_click: 2.5,
    avg_roas: 5
  },
  ads: [
    {
      id: "123",
      name: "Campaign 1",
      impressions: 1000,
      clicks: 50,
      ctr: 5,
      spend: 100,
      revenue: 500,
      conversions: 10,
      // ... المزيد من الحقول
    },
    // ... المزيد من الإعلانات
  ],
  top_5_campaigns: [
    {
      id: "123",
      name: "Campaign 1",
      revenue: 500,
      spend: 100,
      roas: 5,
      status: "ACTIVE"
    },
    // ... المزيد
  ]
}
```

### مثال 2: بيانات ناقصة (بدون إيرادات)

```javascript
{
  total_revenue: '-',
  total_spend: 1000,
  total_sales: '-',
  active_ads: 3,
  total_campaigns: 5,
  insights: {
    click_through_rate: 5,
    conversion_rate: '-',
    avg_cost_per_click: 2,
    avg_roas: '-'  // لا توجد إيرادات
  },
  ads: [
    {
      id: "123",
      name: "Campaign 1",
      impressions: 1000,
      clicks: 50,
      ctr: 5,
      spend: 100,
      revenue: '-',  // لا توجد إيرادات
      conversions: '-',  // لا توجد تحويلات
      // ...
    }
  ],
  top_5_campaigns: []  // فارغة لأنه لا توجد حملات برادات
}
```

---

## الخطوات الموصى بها للاختبار

### الخطوة 1: افتح Dashboard
```
1. اذهب إلى صفحة الداشبورد
2. تأكد من أنك مسجل دخول
```

### الخطوة 2: افتح Developer Tools
```
اضغط F12 أو انقر بزر الماوس الأيمن > Inspect > Console
```

### الخطوة 3: قم بتشغيل الاختبار
```
انسخ والصق الكود أعلاه في console
اضغط Enter
```

### الخطوة 4: تحقق من النتائج
```
- تحقق من console.logs
- تحقق من البيانات المرجعة
- تحقق من عدم وجود أخطاء
```

### الخطوة 5: تحقق من القيم
```
- تأكد من عدم وجود null
- تأكد من أن الأرقام محسوبة بشكل صحيح
- تأكد من أن "-" تحل محل القيم الفارغة
```

---

## استكشاف الأخطاء

### المشكلة: console.logs لا تظهر
**الحل:**
- تأكد من أن بناء المشروع نجح (`npm run build`)
- أعد تحميل الصفحة (Ctrl+F5)
- تحقق من أنك في tab Console الصحيح

### المشكلة: البيانات null
**الحل:**
- تحقق من أن user_id صحيح
- تحقق من أن الاتصال بـ n8n يعمل
- انظر إلى رسالة الخطأ في console

### المشكلة: الحسابات خاطئة
**الحل:**
- تحقق من أن البيانات الخام صحيحة
- تحقق من معادلات الحسابات
- اطبع البيانات الوسيطة في console

### المشكلة: "undefined is not a function"
**الحل:**
- تأكد من استيراد الدوال بشكل صحيح
- تحقق من أن الملفات محفوظة
- أعد بناء المشروع

---

## نصائح للاختبار الفعال

1. **استخدم JSON.stringify للتفتيش العميق:**
   ```javascript
   console.log(JSON.stringify(data, null, 2));
   ```

2. **استخدم console.table للجداول:**
   ```javascript
   console.table(data.ads);
   ```

3. **استخدم console.group للتنظيم:**
   ```javascript
   console.group('Section Name');
   console.log('...data...');
   console.groupEnd();
   ```

4. **استخدم Debugger:**
   ```javascript
   debugger; // سيتوقف هنا عند التشغيل
   ```

5. **اختبر الحالات الحدية:**
   - بيانات فارغة
   - بيانات ناقصة
   - بيانات غير صحيحة

---

تم تحديث النظام بنجاح! الآن كل البيانات ستُعالج تلقائياً وستكون جاهزة للعرض على الداشبورد مباشرة.
