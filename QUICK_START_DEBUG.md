# Quick Start: Debug Email Testing (60 Seconds)

## TL;DR - Just Do This

### Step 1: Sign Up (15 seconds)

```
URL: http://localhost:5173/signup

Form:
- Email: 7bd02025@gmail.com
- Password: test123
- Name: Debug User
- Phone: +1234567890

Click: "Sign Up"

✓ Redirect to homepage
✓ Header shows user menu
✓ DONE - logged in!
```

### Step 2: Subscribe (10 seconds)

```
From homepage:
1. Scroll to pricing
2. Click "Subscribe Now" on any plan
3. Checkout page loads
4. Leave all card fields EMPTY
5. Click "Test Payment"

✓ Processes instantly
✓ Redirects to brief
```

### Step 3: Submit Brief (25 seconds)

```
One question per screen:

1. Email: 7bd02025@gmail.com ← pre-filled
2. Business: "Test"
3. Website: skip or enter
4. Budget: "$1000"
5. Goal: click "Leads"
6. Notes: skip

Click: "Submit Brief"

✓ Redirects to dashboard
```

### Step 4: View Dashboard (10 seconds)

```
You're now in /dashboard

See:
✓ "Hi, Debug User!" greeting
✓ Campaign cards
✓ Chart
✓ "Connect Meta Account" button
✓ Account status showing your plan

Done! Complete flow tested in ~60 seconds.
```

---

## Console Logs to Expect

```javascript
// Sign Up
[DEBUG SIGNUP] Debug email detected, creating immediate session
[DEBUG SIGNUP] Immediate session created for: 7bd02025@gmail.com
[DEBUG SIGNUP PAGE] Debug email signup complete, redirecting to /

// Verify Session
await supabase.auth.getSession()
// Shows: { user: { email: '7bd02025@gmail.com' }, ... }
```

---

## Key Behaviors

### Sign Up with Debug Email
✓ No email confirmation
✓ Session created immediately
✓ Logged in after signup
✓ Redirect to homepage

### Sign In with Debug Email
✓ Accepts ANY password
✓ Password bypass active
✓ Session created
✓ Works multiple times

### Payment with Debug Email
✓ Card fields optional
✓ Leave all blank
✓ Click "Test Payment"
✓ Instant processing

### Other Users
✓ Normal authentication
✓ Email confirmation required
✓ Real payment processing
✓ No bypasses

---

## If Something Doesn't Work

### "Still shows Sign In after signup"
```
Browser console (F12):
1. Hard refresh: Ctrl+Shift+R
2. Run: await supabase.auth.getSession()
3. Should show user email
```

### "Payment page requires card"
```
Check:
1. Yellow debug banner present?
2. Button says "Test Payment"?
3. Email in URL bar shows @gmail.com?
```

### "Brief page doesn't load"
```
Check:
1. Did payment complete?
2. See "Processing..." message?
3. Redirected to /brief?
```

---

## Files to Know

| File | Purpose |
|------|---------|
| `MASTER_TEST_GUIDE.md` | Complete 5-min test flow |
| `DEBUG_AUTH_SETUP.md` | Debug user setup options |
| `AUTH_FLOW_COMPLETE.md` | Full auth documentation |
| `SIGNUP_BYPASS_COMPLETE.md` | Signup bypass details |

---

## Debug Email Credentials

**Always Use**:
- Email: `7bd02025@gmail.com`
- Password: `test123` (or ANY password for sign in)

**Never Share**: Keep debug email offline until going to production

---

## Testing Checklist

- [ ] Sign up with debug email
- [ ] See user menu immediately (not Sign In button)
- [ ] Subscribe to a plan
- [ ] Leave card fields blank
- [ ] Payment processes instantly
- [ ] Brief page loads
- [ ] Answer all questions
- [ ] Submit brief
- [ ] See dashboard
- [ ] See "Connect Meta Account" button

---

## That's It!

Complete SaaS flow tested in under 60 seconds.

**Next**: Remove debug code before production deployment.

See `AUTH_FLOW_COMPLETE.md` for production checklist.
