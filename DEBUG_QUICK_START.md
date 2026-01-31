# Debug Mode Quick Start

## TL;DR

**Email**: `7bd02025@gmail.com`
**Password**: Any password
**Card Details**: Any (or leave blank)

---

## Test Flow in 5 Steps

### 1️⃣ Sign In
```
Go to: /signin
Email: 7bd02025@gmail.com
Password: test (or anything)
→ Logs in instantly, no email confirmation
```

### 2️⃣ Choose Plan
```
Go to: / (landing page)
Scroll to Pricing section
Click "Subscribe Now" on any plan
→ Goes to /checkout
```

### 3️⃣ Checkout (Bypass Payment)
```
URL: /checkout
Yellow banner shows: "DEBUG MODE: Payment validation bypassed"
Card Name: Leave empty or any name
Card Number: Leave empty or any numbers
Expiry: Leave empty
CVV: Leave empty
Click: "Test Payment $XXX" button
→ Instant success, redirects to /brief
```

### 4️⃣ Brief (Typeform Style)
```
URL: /brief
Email: 7bd02025@gmail.com (pre-filled)
Answer 6 questions (1 per screen):
  1. Email (confirm) → Continue
  2. Business name → Continue
  3. Website (optional) → Continue
  4. Monthly budget → Continue
  5. Goal (select one) → Auto-continues
  6. Notes (optional) → Submit Brief
→ Redirects to /dashboard
```

### 5️⃣ Dashboard
```
URL: /dashboard
See personalized greeting & campaign metrics
"Connect Meta Account" button visible
Sign out available
→ Flow complete!
```

---

## What's Different (Debug vs Normal)

| Task | Normal | Debug |
|------|--------|-------|
| Sign In | Email confirmation required | Bypassed ✓ |
| Password | Validated | Any password ✓ |
| Card Name | Required | Optional ✓ |
| Card Number | 16 digits required | Optional ✓ |
| Card Expiry | MM/YY required | Optional ✓ |
| Card CVV | 3-4 digits required | Optional ✓ |
| Payment | Real processing | Simulated ✓ |
| Time | ~5 seconds | ~1 second ✓ |

---

## Check It's Working

### Console Logs (Press F12)
```
[DEBUG] Debug email detected, bypassing password validation
[DEBUG] Debug sign-in successful: 7bd02025@gmail.com
[DEBUG] Payment bypass enabled for debug email: 7bd02025@gmail.com
[Checkout] Payment successful, redirecting to brief...
```

### Visual Indicators
- ✓ Yellow debug banner on checkout page
- ✓ Button says "Test Payment" instead of "Pay"
- ✓ Form fields show "(optional in debug)"

---

## Scope

**Applies ONLY to**:
```
7bd02025@gmail.com
```

**All other emails** use normal auth & payment rules

---

## Database Changes

All changes are real:
- ✓ User subscription saved
- ✓ Payment record created
- ✓ Brief answers saved
- ✓ User state updated
- ✓ Webhook sent to n8n

---

## After Testing

To remove debug mode, search for:
```
DEBUG_EMAIL
DEBUG ONLY – REMOVE AFTER
isDebugMode
```

All isolated and easy to delete.

---

## Troubleshooting

**"Still asking for email confirmation"**
→ Use the debug email exactly: `7bd02025@gmail.com`

**"Card validation still required"**
→ Check browser console for `[DEBUG]` logs
→ Make sure you're using debug email

**"Payment not processing"**
→ Leave all card fields empty (in debug mode they're optional)
→ Click "Test Payment $XXX" button

**"Brief page not loading"**
→ Make sure you completed checkout
→ Subscription must be marked `status: 'active'`

---

## Commands

```bash
# Build project
npm run build

# Run dev server
npm run dev

# Check for debug code
grep -r "DEBUG_EMAIL" src/
grep -r "DEBUG ONLY" src/
```

---

## Next Steps

1. Test the complete flow
2. Verify webhook receives data
3. Check database records
4. When ready, remove debug code using cleanup guide

---

**Status**: ✓ Ready to test
**Build**: ✓ Passing
**All Systems**: ✓ Go
