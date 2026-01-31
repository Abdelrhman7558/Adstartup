# Debug Auth Setup Instructions

## Overview

The debug mode requires the debug user to exist in Supabase Auth. This is because we need a real session to test the full flow.

---

## Setup Steps

### Option 1: Sign Up Through UI (Recommended) ⭐

1. Go to `/signup` in your app
2. Fill in the form:
   - **Email**: `7bd02025@gmail.com`
   - **Password**: Any password (e.g., `test123`)
   - **Full Name**: Debug User
   - **Phone**: +1234567890

3. Click **"Sign Up"**

4. **Automatic bypass**:
   - ✓ No email confirmation needed
   - ✓ Session created immediately
   - ✓ Redirects to homepage (/)
   - ✓ You're now logged in
   - ✓ Header shows user menu

5. Done! You can now sign in with ANY password (debug bypass active)

---

### Option 2: Create User in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"** → **"Create new user"**
4. Fill in:
   - **Email**: `7bd02025@gmail.com`
   - **Password**: `test123` (or any password)
   - **Auto Confirm User**: ✓ Check this box

5. Click **"Create user"**

---

### Option 3: Disable Email Confirmation (Development Only)

If you want to skip email confirmation entirely:

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Email Auth**
3. Find **"Confirm email"** setting
4. Toggle it **OFF**
5. Now any signup will auto-confirm

⚠️ **Warning**: This affects ALL users, not just debug. Only use in development.

---

## How Debug Auth Works

Once the debug user exists in Supabase:

### Normal Flow (Other Users)
```
1. Enter email + password
2. Supabase validates password
3. Checks email confirmation
4. Creates session
5. Redirects
```

### Debug Flow (7bd02025@gmail.com)
```
1. Enter debug email + ANY password
2. Auth bypass ignores password validation
3. Signs in with stored password
4. Creates real Supabase session
5. Redirects
```

---

## Testing the Flow

### Test Sign In

```
Email: 7bd02025@gmail.com
Password: anything (literally type "anything" or "test" or "abc123")
Result: Should sign in successfully
```

### Verify It's Working

1. **Check Console** (F12):
   ```
   [DEBUG] Debug email detected, bypassing password validation
   [DEBUG] Debug sign-in successful: 7bd02025@gmail.com
   ```

2. **Check Header**:
   - Should see user menu with avatar
   - Should show "Debug User" or first name
   - "Sign In" button should disappear

3. **Check State Persistence**:
   - Reload the page
   - Should still be logged in
   - Session persists across reloads

---

## Troubleshooting

### "Invalid login credentials" during sign up

**Problem**: Debug user doesn't exist yet and signup created an account

**Solution**: The account was created automatically. Just:
1. Go to `/signin`
2. Email: `7bd02025@gmail.com`
3. Password: Any password (debug bypass active)

---

### "Still waiting for confirmation" during signup

**Problem**: Shouldn't happen - debug bypass auto-confirms

**Verify**: Check console (F12) for:
```
[DEBUG SIGNUP] Debug email detected, creating immediate session
[DEBUG SIGNUP] Immediate session created for: 7bd02025@gmail.com
```

**Solution**: If you don't see these logs, manually confirm:
1. Go to Supabase Dashboard → Authentication → Users
2. Find `7bd02025@gmail.com`
3. Click the "..." menu
4. Select "Confirm email"

---

### Still shows "Sign In" button after login

**Problem**: Auth state not updating in React

**Solutions**:
1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. Clear browser cache and cookies
3. Check console for errors
4. Verify session exists:
   ```javascript
   // In browser console:
   const { data } = await supabase.auth.getSession()
   console.log(data)
   ```

---

### "Cannot read properties of null"

**Problem**: Auth state loading but components rendering before user data loads

**Solution**: This is handled automatically by the loading state in AuthProvider

---

## Manual Session Check

You can check the current session in browser console:

```javascript
// Open DevTools Console (F12)

// Check current session
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('User:', session?.user)
console.log('Email:', session?.user?.email)

// Force refresh session
await supabase.auth.refreshSession()
```

---

## Reset Debug User

If you need to start fresh:

1. **Sign Out**: Click user menu → Sign Out
2. **Clear Session**:
   ```javascript
   // In browser console:
   await supabase.auth.signOut()
   localStorage.clear()
   ```
3. **Delete User** (if needed):
   - Supabase Dashboard → Authentication → Users
   - Find `7bd02025@gmail.com`
   - Delete user
4. **Re-create**: Follow setup steps again

---

## Important Notes

### Debug Mode Scope

Debug bypass applies ONLY to:
- **Password validation**: Any password accepted
- **Email confirmation check**: Bypassed if user exists

Debug mode does NOT bypass:
- **User existence**: User must exist in Supabase
- **Session creation**: Real session is created
- **Database operations**: All operations are real

### Security

This is ONLY for development testing. The debug code:
- Is clearly marked with `// DEBUG ONLY` comments
- Only affects one specific email
- Should be removed before production deployment
- Does not affect any other users

### Production Considerations

Before deploying to production:
1. Remove all debug bypass code
2. Search for: `DEBUG_EMAIL`, `DEBUG ONLY`, `7bd02025@gmail.com`
3. Test sign-in flow with real authentication
4. Ensure email confirmation is enabled
5. Test payment flow with real Stripe

---

## Quick Reference

| Task | Command/Action |
|------|----------------|
| Create debug user | Signup at `/signup` or Supabase Dashboard |
| Confirm email | Supabase Dashboard → Users → Confirm |
| Sign in | Email: `7bd02025@gmail.com`, Password: any |
| Check session | `await supabase.auth.getSession()` in console |
| Sign out | User menu → Sign Out |
| Clear session | `localStorage.clear()` in console |
| Check auth state | Look for `[DEBUG]` logs in console |

---

## Status Checklist

Before testing, ensure:

- [ ] Debug user created in Supabase
- [ ] Email confirmed (or email confirmation disabled)
- [ ] App is running (`npm run dev`)
- [ ] Browser console is open (F12)
- [ ] You're using the exact email: `7bd02025@gmail.com`

Once set up, you can test the complete flow:

✓ Sign In → Pricing → Subscribe → Checkout → Brief → Dashboard

---

**Need Help?**

Check browser console for error messages or auth state logs. All debug operations log to console with `[DEBUG]` prefix.
