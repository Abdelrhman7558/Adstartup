# Master Test Guide - Complete SaaS Flow

## Quick Start

**Email**: `7bd02025@gmail.com`
**Password**: ANY (try: `test`, `password`, `test123`, `debug`)

---

## Prerequisites

### 1. Create Debug User (One-Time Setup) ⭐ Easiest Way

**Sign Up in UI** (automatic email bypass):
```
1. Go to http://localhost:5173/signup
2. Email: 7bd02025@gmail.com
3. Password: test123 (or any password)
4. Full Name: Debug User
5. Phone: +1234567890
6. Click "Sign Up"
7. ✓ Automatic! Session created instantly
8. ✓ Redirects to homepage
9. ✓ Already logged in!
```

**Done in 10 seconds!** No email confirmation needed. After this, you can sign in with ANY password.

---

## Complete Flow Test (5 Minutes)

### Step 1: Sign In (Debug Mode)
```
URL: http://localhost:5173/signin

Email: 7bd02025@gmail.com
Password: anything (literally type "test" or "abc" or "12345")

Expected:
✓ Console shows: [DEBUG] Debug email detected...
✓ Signs in successfully
✓ Redirects to homepage (/)
✓ Header now shows user avatar menu (not "Sign In" button)
```

---

### Step 2: View Plans
```
Current: Homepage

Action: Scroll down to Pricing section

Expected:
✓ See 3 plans: Starter, Growth, Agency
✓ All buttons say "Subscribe Now" (not "Start Free")
✓ Buttons are clickable
```

---

### Step 3: Select Plan
```
Action: Click "Subscribe Now" on any plan (Growth recommended)

Expected:
✓ Redirects to /checkout
✓ Yellow debug banner appears: "DEBUG MODE: Payment validation bypassed"
✓ Plan summary shows selected plan
✓ Card form fields visible
```

---

### Step 4: Checkout (Payment Bypass)
```
URL: /checkout

Card Form:
- Cardholder Name: Leave EMPTY (or enter any name)
- Card Number: Leave EMPTY (or enter any numbers)
- Expiry: Leave EMPTY
- CVV: Leave EMPTY

Note: All fields say "(optional in debug)" for debug user

Button: "Test Payment $XXX" (not "Pay Securely")

Action: Click "Test Payment" button

Expected:
✓ Console shows: [DEBUG] Payment bypass enabled...
✓ Processes instantly (500ms)
✓ Subscription created in database
✓ Redirects to /brief
```

---

### Step 5: Brief (Typeform Style)
```
URL: /brief

Progress bar at top shows 0%

Question 1: Email
- Pre-filled with 7bd02025@gmail.com
- Click "Continue" or press Enter

Question 2: Business Name
- Enter: "Test Business"
- Click "Continue"

Question 3: Website (Optional)
- Enter: "https://example.com" or skip
- Click "Continue"

Question 4: Monthly Ad Budget
- Enter: "$5,000"
- Click "Continue"

Question 5: Main Goal
- Click one: "Leads" (or Sales/Traffic/Awareness)
- Auto-continues to next question

Question 6: Additional Notes
- Enter any text or leave empty
- Click "Submit Brief"

Expected:
✓ Progress bar fills as you answer
✓ Smooth transitions between questions
✓ Can go back with back button
✓ Can use keyboard (Enter key)
✓ After submit: "Brief Submitted!" message
✓ Redirects to /dashboard
```

---

### Step 6: Dashboard
```
URL: /dashboard

Expected:
✓ Greeting: "Hi, Debug User!" (or your name)
✓ Left sidebar with navigation icons
✓ Top right: Search bar, settings, notifications, "Connect Meta Account" button
✓ Campaign performance cards
✓ Monthly performance chart
✓ AI Optimization card (dark)
✓ Account status showing:
  - Plan: Growth (or your selected plan)
  - Brief Status: Completed
  - Meta Connected: Not Connected
✓ Quick Actions card with "Connect Meta Account" button
✓ Sign out button at bottom of sidebar
```

---

### Step 7: Sign Out
```
Action: Click user avatar in sidebar → Sign Out

Expected:
✓ Session cleared
✓ Redirects to homepage
✓ Header shows "Sign In" and "Start Free" buttons again
✓ No longer shows user menu
```

---

## Verification Checklist

### Auth & Session
- [ ] Debug email signs in with any password
- [ ] Header updates immediately after sign in
- [ ] User menu shows avatar with initials
- [ ] Reload page - still logged in
- [ ] Sign out clears session completely

### Navigation Flow
- [ ] Not logged in → Subscribe redirects to /signup
- [ ] Logged in → Subscribe redirects to /checkout
- [ ] Checkout requires authentication
- [ ] Brief requires authentication + subscription
- [ ] Dashboard requires authentication + subscription

### Payment Bypass
- [ ] Debug email sees yellow banner on checkout
- [ ] Card fields optional for debug user
- [ ] Button says "Test Payment" not "Pay Securely"
- [ ] Payment processes instantly (< 1 second)
- [ ] Subscription saved to database

### Brief Submission
- [ ] One question per screen
- [ ] Progress bar updates
- [ ] Email pre-filled
- [ ] Can navigate with Enter key
- [ ] Can go back
- [ ] Webhook sent to n8n
- [ ] Redirects to dashboard after submit

### Dashboard
- [ ] Shows personalized greeting
- [ ] "Connect Meta Account" button visible (2 places)
- [ ] Account status accurate
- [ ] Campaign cards display
- [ ] Chart displays
- [ ] Sign out works

---

## Console Verification

Open DevTools Console (F12) and look for:

### Sign Up
```
[DEBUG SIGNUP] Debug email detected, creating immediate session
[DEBUG SIGNUP] Immediate session created for: 7bd02025@gmail.com
[DEBUG SIGNUP PAGE] Debug email signup complete, redirecting to /
```

### Sign In
```
[DEBUG] Debug email detected, bypassing password validation
[DEBUG] Trying fallback passwords...
[DEBUG] Signed in with fallback password
[DEBUG] Debug sign-in successful: 7bd02025@gmail.com
```

### Checkout
```
[DEBUG] Payment bypass enabled for debug email: 7bd02025@gmail.com
[Checkout] Payment successful, redirecting to brief...
```

### Session Check
```javascript
// Run in console:
const { data: { session } } = await supabase.auth.getSession()
console.log('Logged in:', !!session)
console.log('Email:', session?.user?.email)
```

---

## Database Verification

After completing flow, these records should exist:

### Subscriptions Table
```sql
SELECT * FROM subscriptions WHERE user_id = '<your_user_id>';

Expected:
- status: 'active'
- plan_name: 'Growth' (or selected plan)
- payment_method: 'stripe'
```

### Campaign Briefs Table
```sql
SELECT * FROM campaign_briefs WHERE user_id = '<your_user_id>';

Expected:
- email: '7bd02025@gmail.com'
- business_name: 'Test Business'
- goal: 'Leads'
- All answers saved
```

### User States Table
```sql
SELECT * FROM user_states WHERE user_id = '<your_user_id>';

Expected:
- has_active_subscription: true
- has_completed_brief: true
- current_step: 'brief_completed'
```

---

## Troubleshooting

### "Invalid login credentials"

**Fix**: Debug user doesn't exist yet

**Solution**: Follow Prerequisites → Create Debug User

---

### "Debug user not found"

**Fix**: Same as above - user must exist first

**Solution**: Sign up at `/signup` with debug email

---

### "Email not confirmed"

**Fix**: Email needs confirmation

**Solution**:
- Supabase Dashboard → Authentication → Users
- Find 7bd02025@gmail.com → Confirm email

---

### Header still shows "Sign In" after login

**Fix**: Auth state not updating

**Solution**:
1. Hard refresh: Ctrl+Shift+R
2. Check console for errors
3. Run in console: `await supabase.auth.getSession()`
4. If session is null, sign in again

---

### Payment page requires card details

**Fix**: Not in debug mode

**Verify**:
- Email is exactly `7bd02025@gmail.com`
- Yellow debug banner appears
- Button says "Test Payment"

---

### Brief page not loading

**Fix**: Subscription not active

**Verify**:
- Completed checkout successfully
- Console showed redirect message
- Database has active subscription

---

## Reset and Retry

If something goes wrong:

### Clear Session
```javascript
// In browser console:
await supabase.auth.signOut()
localStorage.clear()
// Then refresh page
```

### Delete Test Data
```sql
-- In Supabase SQL Editor:
DELETE FROM subscriptions WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = '7bd02025@gmail.com'
);

DELETE FROM campaign_briefs WHERE email = '7bd02025@gmail.com';

DELETE FROM user_states WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = '7bd02025@gmail.com'
);
```

### Start Fresh
1. Clear session (above)
2. Delete test data (above)
3. Sign in again
4. Re-test flow

---

## Performance Benchmarks

Expected timing for debug flow:

| Step | Expected Time |
|------|---------------|
| Sign In | < 2 seconds |
| Subscribe Click | Instant |
| Checkout Load | < 1 second |
| Payment Process | < 1 second (debug) |
| Brief Submit | < 2 seconds |
| Dashboard Load | < 1 second |
| **Total Flow** | **< 60 seconds** |

---

## Success Criteria

✓ All 7 steps completed without errors
✓ Auth state updates immediately
✓ Session persists on reload
✓ No broken links or dead clicks
✓ All data saved to database
✓ Webhook sent successfully
✓ Dashboard fully accessible
✓ Sign out works correctly

---

## Next: Production Deployment

After testing is complete:

1. Remove debug code (see `AUTH_FLOW_COMPLETE.md`)
2. Set up real Stripe integration
3. Configure Meta OAuth
4. Test with real users
5. Enable email confirmation
6. Deploy to production

---

## Support

### Documentation
- `AUTH_FLOW_COMPLETE.md` - Complete auth system docs
- `DEBUG_MODE_ENABLED.md` - Debug features
- `DEBUG_AUTH_SETUP.md` - Debug user setup
- `FLOW_IMPLEMENTATION_COMPLETE.md` - SaaS flow docs

### Quick Commands
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck
```

---

## Status

✅ **Auth System**: Complete
✅ **Session Persistence**: Working
✅ **Payment Flow**: Functional (with debug bypass)
✅ **Brief Submission**: Working (Typeform style)
✅ **Dashboard**: Fully implemented
✅ **Debug Mode**: Active for testing
✅ **Build**: Passing

**Ready to Test**: Yes
**Production Ready**: After removing debug code
**Complete Flow**: Functional from sign-in to dashboard

---

**Time to complete test**: 5 minutes
**Prerequisites setup**: 2 minutes (one-time)
**Total first run**: 7 minutes
