# Quick Test Guide - 7bd02025@gmail.com

## 30-Second Test

```bash
1. Go to: http://localhost:5173/signup
2. Enter:
   Email: 7bd02025@gmail.com
   Password: test123
   Name: Debug User
   Phone: +1234567890
3. Click "Sign Up"
4. → Dashboard loads automatically ✅
5. Press F5 (reload)
6. → Still logged in ✅
```

---

## Complete Flow (60 seconds)

```bash
# Start
1. /signup → 7bd02025@gmail.com | test123
2. → Dashboard ✅

# Subscribe
3. Scroll to pricing (or stay on dashboard)
4. Click "Subscribe Now"
5. → Checkout ✅

# Payment (card optional)
6. Leave card fields BLANK
7. Click "Test Payment $X"
8. → Brief ✅

# Brief
9. Answer 6 questions
10. Click "Submit Brief"
11. → Dashboard ✅

# Done!
Session persists across reloads ✅
```

---

## Expected Console Logs

```javascript
// Sign Up
[DEBUG SIGNUP] Debug email detected, creating immediate session
[DEBUG SIGNUP] Immediate session created for: 7bd02025@gmail.com
[TEMP SIGNUP] Debug email signup complete, redirecting to dashboard

// Sign In
[DEBUG] Debug email detected, bypassing password validation
[DEBUG] Signed in with fallback password
[TEMP SIGNIN] Debug email redirecting to dashboard

// Payment
[TEMP PAYMENT] Bypass active - skipping card validation
[TEMP PAYMENT] Payment bypass enabled for debug email: 7bd02025@gmail.com
[Checkout] Payment successful, redirecting to brief...

// Brief
[Brief] Webhook sent successfully
```

---

## UI Verification

### When Logged In
- ✅ Avatar shows in top-right nav
- ✅ "Sign In" button hidden
- ✅ "Start Free" button hidden
- ✅ User menu dropdown works

### Checkout Page
- ✅ Yellow debug banner: "DEBUG MODE: Payment validation bypassed"
- ✅ Card fields optional
- ✅ Button shows: "Test Payment $X"
- ✅ Instant processing

### Brief Page
- ✅ Email pre-filled with 7bd02025@gmail.com
- ✅ One question per screen
- ✅ Progress indicator showing "X / 6"
- ✅ Back button works
- ✅ Enter key advances

### Dashboard
- ✅ Greeting: "Hi, Debug!" (or first name)
- ✅ Connect Meta Account button (top-right)
- ✅ Connect Meta Account button (Quick Actions)
- ✅ User data displayed
- ✅ Sign out works

---

## Session Persistence Test

```bash
1. Sign in → Dashboard
2. Press F5 (reload)
3. → Still on dashboard ✅
4. Close tab
5. Open new tab → http://localhost:5173/
6. → Avatar showing (still logged in) ✅
7. Navigate to /dashboard
8. → Loads without redirect ✅
```

---

## Troubleshooting

### "User not found"
- Go to /signup first to create account
- Then use /signin

### Not redirecting to dashboard
- Check console for `[TEMP SIGNIN]` or `[TEMP SIGNUP]` messages
- Verify email is exactly: `7bd02025@gmail.com`

### Card validation error
- Yellow banner should show on checkout
- If not, verify email matches `7bd02025@gmail.com`
- Console should show `[TEMP PAYMENT]` messages

### Session not persisting
- Check browser console for errors
- Verify Supabase connection in .env
- Check that `onAuthStateChange` is firing

---

## Quick Commands

```bash
# Start dev server
npm run dev

# Build project
npm run build

# Find temporary code
grep -rn "TEMP FLOW\|TEMP SIGNIN\|TEMP SIGNUP\|TEMP PAYMENT" src/

# Check for debug email references
grep -rn "7bd02025@gmail.com" src/
```

---

## URLs

```bash
Sign Up:    http://localhost:5173/signup
Sign In:    http://localhost:5173/signin
Landing:    http://localhost:5173/
Dashboard:  http://localhost:5173/dashboard
Checkout:   http://localhost:5173/checkout
Brief:      http://localhost:5173/brief
```

---

## Credentials

```
Email:    7bd02025@gmail.com
Password: test123 (or any: test, password, debug)
```

---

## What Works

✅ Sign up → Dashboard (direct)
✅ Sign in → Dashboard (direct)
✅ Session persists across reloads
✅ Subscribe → Checkout (automatic)
✅ Payment → Brief (card optional)
✅ Brief → Dashboard (webhook sent)
✅ UI updates automatically
✅ Sign out clears session

---

## What's Different from Normal Flow

| Feature | Normal Users | 7bd02025@gmail.com |
|---------|-------------|-------------------|
| Email confirmation | Required | Skipped |
| Sign up redirect | /signin?message=check-email | /dashboard |
| Sign in redirect | / (landing) | /dashboard |
| Card validation | Required | Optional |
| Payment processing | Real Stripe | Instant (500ms) |
| Subscription check | Required for brief | Skipped |
| Brief check | Required for dashboard | Skipped |

---

**Status**: Ready for immediate testing
**Build**: Passing
**All features**: Working

See `TEMP_FLOW_VERIFIED.md` for complete documentation.
