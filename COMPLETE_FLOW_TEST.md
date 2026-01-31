# Complete Flow Test Guide (60 Seconds)

## One-Page Quick Reference

### The Journey

```
Sign Up (10s) → Homepage (5s) → Pricing (5s) → Checkout (5s)
→ Payment (5s) → Brief (20s) → Dashboard (5s) = 60 seconds total
```

---

## Step-by-Step

### 1. SIGN UP (10 seconds)

```
Go to: http://localhost:5173/signup

Fill form:
✓ Email:    7bd02025@gmail.com
✓ Password: test123
✓ Name:     Debug User
✓ Phone:    +1234567890

Click: "Sign Up"

Result: Redirected to homepage (already logged in)
```

---

### 2. HOMEPAGE (5 seconds)

```
See: "Hi, Debug User" in header
     User menu with avatar

Scroll down to Pricing section
```

---

### 3. PRICING (5 seconds)

```
See 3 plans:
- Starter: $149/mo
- Growth: $299/mo (popular)
- Agency: $599/mo

Click: "Start Free Trial" (any plan)

Result: Redirected to /checkout
```

---

### 4. CHECKOUT (5 seconds)

```
See:
✓ Yellow banner: "DEBUG MODE: Payment validation bypassed"
✓ Plan summary with total price
✓ Payment form

Leave card fields BLANK (optional in debug)

Click: "Test Payment $X"

Result: Button shows spinning animation
```

---

### 5. PAYMENT PROCESSING (5 seconds)

```
Console logs:
[TEMP PAYMENT] Payment bypass enabled for debug email
[Checkout] Payment successful, redirecting to brief...

UI: Processing spinner (500ms)

Result: Redirected to /brief
```

---

### 6. BRIEF FORM (20 seconds)

```
Question 1/6: "What's your email address?"
Answer: 7bd02025@gmail.com (pre-filled)
Click: "Next" or press Enter

Question 2/6: "What's your business name?"
Answer: Test Business
Click: "Next"

Question 3/6: "What's your website?"
Answer: (skip or enter)
Click: "Next"

Question 4/6: "What's your monthly ad budget?"
Answer: $5000
Click: "Next"

Question 5/6: "What's your main goal?"
Answer: Click "Leads"
Click: "Next"

Question 6/6: "Anything else we should know?"
Answer: (skip or enter notes)
Click: "Submit Brief"

Result: Success animation → Redirect to /dashboard (1.5s)
```

---

### 7. DASHBOARD (5 seconds)

```
See:
✓ "Hi, Debug User!" greeting
✓ 4 stat cards (stats, spend, conversions, ROI)
✓ Chart showing performance
✓ 4 campaign cards
✓ "Connect Meta Account" button
✓ Sign out in top right

YOU ARE NOW ON THE DASHBOARD!
Complete flow time: ~60 seconds
```

---

## Verification

### Console Logs (F12)

Should see:
```
[DEBUG SIGNUP] Debug email detected, creating immediate session
[DEBUG SIGNUP] Immediate session created for: 7bd02025@gmail.com
[TEMP PAYMENT] Payment bypass enabled for debug email
[Checkout] Payment successful, redirecting to brief...
```

### Database (Supabase)

Check tables:
- ✓ auth.users: User exists
- ✓ profiles: User profile with name
- ✓ subscriptions: Active subscription
- ✓ campaign_briefs: Brief with answers
- ✓ user_states: has_active_subscription=true, has_completed_brief=true

---

## If Something Breaks

### Payment doesn't complete

```
1. Check console for errors
2. Verify email is 7bd02025@gmail.com
3. Verify yellow debug banner shows
4. Check network tab for failed requests
5. Hard refresh: Ctrl+Shift+R
```

### Brief page won't load

```
1. Check subscription created in Supabase
2. Check user_states updated
3. Verify no redirect loops
4. Check console for errors
```

### Dashboard blocked

```
1. Check user is authenticated
2. Verify campaign_briefs exists
3. Verify user_states updated
4. Hard refresh the page
```

---

## Key Behaviors

✅ Debug email (7bd02025@gmail.com):
- Card fields optional on checkout
- Instant payment (500ms)
- No subscription validation needed for /brief
- Can access dashboard immediately

✅ All users:
- Session persists across reloads
- Sign out clears session
- Webhook sends automatically
- All data saved to database

---

## Files

Main docs:
- `TEMP_FLOW_OVERRIDE.md` - Complete technical details
- `QUICK_START_DEBUG.md` - Quick auth testing
- `MASTER_TEST_GUIDE.md` - Full testing guide
- `AUTH_FLOW_COMPLETE.md` - Auth system docs

---

## Build Status

```
✅ Build: Passing
✅ TypeScript: No errors
✅ Time: ~8 seconds
✅ Size: 635.25 kB
```

---

## That's It!

**60 seconds**: Complete SaaS flow from signup to dashboard.

Next: Remove TEMP code before production.

See `TEMP_FLOW_OVERRIDE.md` for production checklist.
