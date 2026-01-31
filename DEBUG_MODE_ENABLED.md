# Debug Mode Implementation

## Overview

Debug mode has been implemented to enable seamless testing of the complete SaaS flow without real authentication or payment processing. **This applies ONLY to the email: `7bd02025@gmail.com`**

---

## Features

### 1. Sign In Override

**Email**: `7bd02025@gmail.com`
**Password**: ANY password (validation bypassed)

**Behavior**:
- Accepts any password without validation
- Skips email confirmation checks
- Creates valid authenticated session
- User appears as fully logged-in throughout the app
- Session persists across page reloads

**Location**: `src/contexts/AuthContext.tsx` - Line 195-213

```typescript
// DEBUG ONLY – REMOVE AFTER AUTH FIX
const DEBUG_EMAIL = '7bd02025@gmail.com';
if (email === DEBUG_EMAIL) {
  console.log('[DEBUG] Debug email detected, bypassing password validation');
  return { error: null };
}
```

---

### 2. Payment Bypass

**Email**: `7bd02025@gmail.com`
**Card Details**: ANY values (validation bypassed)

**Behavior**:
- Skips card validation (name, number, expiry, CVV)
- All form fields become optional
- Payment processes instantly (500ms simulated delay)
- Immediately marks subscription as ACTIVE
- Saves subscription to database
- Creates payment record
- Updates user state
- Redirects to `/brief`

**Visual Indicator**: Yellow debug banner at top of checkout page
**Button Text**: "Test Payment $XXX" (instead of "Pay $XXX Securely")

**Location**: `src/pages/Checkout.tsx` - Line 34-36, 113-124, 130-137, 216-221

```typescript
// DEBUG ONLY – REMOVE AFTER PAYMENT FIX
const DEBUG_EMAIL = '7bd02025@gmail.com';
const isDebugMode = user?.email === DEBUG_EMAIL;

if (isDebugMode) {
  console.log('[DEBUG] Payment bypass enabled for debug email:', user.email);
  // Skip payment processing, simulate instant success
  await new Promise(resolve => setTimeout(resolve, 500));
}
```

---

### 3. Brief Flow (Unchanged)

The Brief page works normally with one enhancement:

**Email Pre-fill**: The email field is automatically pre-filled with the user's email (7bd02025@gmail.com)

- User still goes through all 6 questions
- Typeform-style UX with transitions
- Webhook sent to n8n endpoint with full payload
- Database records created
- Redirects to Dashboard

**Location**: `src/pages/Brief.tsx` - Line 36-38 (automatic pre-fill)

---

### 4. Dashboard

Once Brief is submitted, user is redirected to full Dashboard:

- Shows personalized greeting: "Hi, Debug User!"
- Displays account status
- Shows "Connect Meta Account" button
- Full dashboard functionality enabled
- User can sign out

---

## Complete Test Flow

### Step 1: Sign In
```
URL: http://localhost:5173/signin
Email: 7bd02025@gmail.com
Password: anypassword (e.g., "test", "anything", "123")
Result: Logged in, redirected based on subscription status
```

### Step 2: Plans Page
```
URL: http://localhost:5173/#pricing
Action: Click "Subscribe Now" on any plan
Result: Redirected to /checkout with plan details
```

### Step 3: Checkout (Payment Bypass)
```
URL: http://localhost:5173/checkout
Visual: Yellow debug banner appears
Card Name: (optional) Leave empty or enter any name
Card Number: (optional) Leave empty or enter any numbers
Expiry: (optional) Leave empty
CVV: (optional) Leave empty
Button: "Test Payment $XXX"
Action: Click button
Result: Instant payment success → Redirected to /brief
```

### Step 4: Brief (Typeform Style)
```
URL: http://localhost:5173/brief
Email: 7bd02025@gmail.com (pre-filled)
Question 1: Confirm email → Click Continue
Question 2: Business name → Enter any name → Continue
Question 3: Website (optional) → Skip or enter URL → Continue
Question 4: Monthly budget → Enter amount → Continue
Question 5: Main goal → Click one of [Leads/Sales/Traffic/Awareness] → Auto-continues
Question 6: Additional notes → (optional) Leave empty or add notes → Submit Brief
Result: Webhook sent, database updated → Redirected to /dashboard
```

### Step 5: Dashboard
```
URL: http://localhost:5173/dashboard
Content:
  - Greeting: "Hi, Debug User!"
  - Campaign performance metrics
  - "Connect Meta Account" button (top right)
  - Account status card showing active subscription
  - Sign out button (bottom left)
Action: Click "Connect Meta Account" or "Sign Out"
```

---

## Console Logs

Open browser DevTools Console to see debug messages:

```
[DEBUG] Debug email detected, bypassing password validation
[DEBUG] Debug sign-in successful: 7bd02025@gmail.com
[DEBUG] Payment bypass enabled for debug email: 7bd02025@gmail.com
[Checkout] Payment successful, redirecting to brief...
```

---

## What's Bypassed (Debug Only)

| Component | Normal | Debug |
|-----------|--------|-------|
| Email Confirmation | ✓ Required | ✗ Skipped |
| Password Validation | ✓ Required | ✗ Skipped |
| Card Name Validation | ✓ Required | ✗ Optional |
| Card Number Validation | ✓ 16-digit required | ✗ Optional |
| Expiry Date Validation | ✓ MM/YY format required | ✗ Optional |
| CVV Validation | ✓ 3-4 digits required | ✗ Optional |
| Payment Processing | ✓ Real Stripe integration | ✗ Simulated (500ms) |

---

## Safety & Scoping

**All bypasses are scoped to ONE email:**

```typescript
const DEBUG_EMAIL = '7bd02025@gmail.com';
if (email === DEBUG_EMAIL) {
  // DEBUG CODE ONLY
}
```

**All other users** follow normal authentication and payment rules:
- Email confirmation still required
- Password validation enforced
- Card validation required
- Real payment processing (Stripe simulation)

---

## Important Notes

### For Developers
- All debug code is clearly marked: `// DEBUG ONLY – REMOVE AFTER AUTH FIX`
- Code is wrapped in `if (email === "7bd02025@gmail.com")` blocks
- No global disables or feature flags
- No impact on production logic for other users

### Cleanup Instructions
When ready to remove debug mode:

1. **AuthContext.tsx** (Line 195-213): Remove `signIn` function debug block
2. **Checkout.tsx** (Line 34-36, 113-124, 130-137, 216-221): Remove all `isDebugMode` logic
3. **Checkout.tsx** (Line 280, 295, 311, 326): Remove "(optional in debug)" labels
4. Search codebase for `DEBUG_EMAIL` and remove all references

### Testing Other Users
This debug mode does NOT affect other users:
- Sign up with any email → Normal auth flow
- Real email confirmation required
- Real password validation
- Real card validation on checkout
- Existing test users continue to work normally

---

## Webhook Integration

Brief submissions still send to the webhook:
```
POST https://n8n.srv1181726.hstgr.cloud/webhook-test/Brief
```

Payload includes:
```json
{
  "email": "7bd02025@gmail.com",
  "user_id": "debug_1234567890",
  "plan": "Growth",
  "brief_answers": {
    "businessName": "Test Business",
    "website": "https://example.com",
    "monthlyBudget": "$5,000",
    "goal": "Leads",
    "notes": "..."
  },
  "timestamp": "2025-12-16T..."
}
```

---

## Database Records

All database operations are performed normally:

1. **Subscriptions Table**:
   - `status: 'active'`
   - `plan_name: 'Growth'` (or selected plan)
   - `plan_price: 299` (or selected price)
   - `payment_id: 'stripe_...'`

2. **Payments Table**:
   - `status: 'completed'`
   - `provider: 'stripe'`
   - `amount: 299` (or calculated amount)

3. **Campaign Briefs Table**:
   - All answers saved
   - `email: '7bd02025@gmail.com'`
   - `business_name`, `website`, `monthly_budget`, `goal`, etc.

4. **User States Table**:
   - `has_active_subscription: true`
   - `has_completed_brief: true`
   - `current_step: 'brief_completed'`

---

## After Testing

### To Remove Debug Mode
Follow the cleanup instructions above. The overrides are minimal and isolated.

### To Keep as Feature Flag
Wrap debug checks in environment variable:
```typescript
const isDebug = import.meta.env.VITE_DEBUG_MODE === 'true';
const DEBUG_EMAIL = '7bd02025@gmail.com';
if (isDebug && email === DEBUG_EMAIL) { ... }
```

### To Add More Debug Emails
Change the condition to:
```typescript
const DEBUG_EMAILS = ['7bd02025@gmail.com', 'test@example.com'];
if (DEBUG_EMAILS.includes(email)) { ... }
```

---

## Status

✓ Debug mode implemented
✓ All flows tested and working
✓ Build successful
✓ No breaking changes to production logic
✓ Clear, isolated debug code
✓ Easy to remove/refactor

---

## Version

- **Created**: December 16, 2025
- **Build**: Passing
- **Applied to**: Sign In, Checkout
- **Scope**: Single email only
- **Status**: Ready for testing
