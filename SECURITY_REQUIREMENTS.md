# 🔒 Security Requirements - Adstartup Authentication

This document outlines the mandatory security requirements for the Adstartup authentication system.

---

## 1️⃣ DOMAIN & REDIRECT VALIDATION

### Production Domain
**Primary Domain**: `https://ad-startup.com`

All authentication redirects MUST use this domain exclusively.

### Implementation
- **Location**: `src/lib/domainValidation.ts`
- **Constant**: `PRODUCTION_DOMAIN = 'https://ad-startup.com'`
- **Whitelist**:
  ```typescript
  const ALLOWED_DOMAINS = [
    'https://ad-startup.com',      // Production
    'http://localhost:5173',       // Development only
  ];
  ```

### Redirect URLs
✅ **Sign Up Email Verification**:
```typescript
emailRedirectTo: 'https://ad-startup.com/auth/confirm'
```

✅ **Password Reset**:
```typescript
redirectTo: 'https://ad-startup.com/reset-password'
```

### Guards
- All redirects validated against whitelist
- Non-whitelisted domains logged and blocked
- Fallback to `/signin` for invalid redirects
- Console logging for security monitoring

### Code Reference
```typescript
// src/contexts/AuthContext.tsx
import { PRODUCTION_DOMAIN } from '../lib/domainValidation';

const emailRedirectTo = `${PRODUCTION_DOMAIN}/auth/confirm`;
```

---

## 2️⃣ PUBLISHED WEBSITE REQUIREMENT

### Production Checklist
- ✅ Website deployed and publicly accessible at `https://ad-startup.com`
- ✅ Route `/auth/confirm` exists and is reachable
- ✅ Route `/reset-password` exists (for password reset)
- ✅ All assets (CSS, JS, images) loading correctly
- ✅ HTTPS enabled with valid SSL certificate
- ✅ DNS properly configured

### Development Environment
- Local development uses `http://localhost:5173`
- Auth redirects work in both environments
- Environment auto-detected via `import.meta.env.DEV`

### Verification
Test production URL accessibility:
```bash
curl -I https://ad-startup.com/auth/confirm
# Expected: HTTP/2 200 OK
```

---

## 3️⃣ AUTH CONFIRM PAGE LOGIC

### Flow: `/auth/confirm`
**Location**: `src/pages/AuthConfirm.tsx`

1. **On Page Load**:
   - Call `supabase.auth.getSession()`
   - Supabase automatically detects token in URL
   - Session retrieved if token is valid

2. **Session Exists & Email Confirmed**:
   ```typescript
   if (session?.user && session.user.email_confirmed_at) {
     setStatus('success');
     setMessage('Email confirmed successfully!');
     setTimeout(() => navigate('/dashboard'), 2000);
   }
   ```

3. **No Session or Not Confirmed**:
   ```typescript
   else {
     setStatus('error');
     setMessage('Please confirm your email to continue.');
     setTimeout(() => navigate('/signin?message=please-confirm'), 3000);
   }
   ```

### Visual Feedback
- **Loading**: Spinner + "Verifying your email..."
- **Success**: ✅ Checkmark + "Email confirmed successfully!"
- **Error**: ❌ X icon + error message

### Security Logging
```typescript
console.log('[AuthConfirm] Session check:', {
  hasSession: !!session,
  hasUser: !!session?.user,
  emailConfirmed: session?.user?.email_confirmed_at,
  error: error?.message,
});
```

### Error Handling
- Session errors → redirect to `/signin?message=verification-failed`
- No session → redirect to `/signin?message=please-confirm`
- Unexpected errors → redirect to `/signin`
- All errors logged to console with `[AuthConfirm]` prefix

---

## 4️⃣ SIGN UP FLOW ENFORCEMENT

### Complete Flow
**Location**: `src/contexts/AuthContext.tsx` → `signUp()`

1. **Create Auth User**:
   ```typescript
   const { data: authData, error } = await supabase.auth.signUp({
     email,
     password,
     options: {
       emailRedirectTo: 'https://ad-startup.com/auth/confirm',
       data: {
         full_name: fullName,
         phone_number: phoneNumber,
       },
     },
   });
   ```

2. **Send Verification Email**:
   - Supabase sends branded email automatically
   - Template configured in Supabase Dashboard
   - Contains confirmation link with token

3. **Automatic Database Trigger**:
   **Migration**: `fix_user_creation_trigger_metadata.sql`
   ```sql
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW
     EXECUTE FUNCTION public.handle_new_user();
   ```

   **Trigger Function**:
   - Inserts into `public.users` (with phone from metadata)
   - Inserts into `public.user_states` (with 'signed_up' status)
   - Uses `SECURITY DEFINER` to bypass RLS
   - Uses `ON CONFLICT DO NOTHING` to prevent duplicates

4. **Create Profile Record**:
   ```typescript
   await supabase.from('profiles').insert({
     id: authData.user.id,
     full_name: fullName,
     phone_number: phoneNumber,
   });
   ```

5. **Send Webhook Notification**:
   ```typescript
   await fetch('https://n8n.srv1181726.hstgr.cloud/webhook-test/Sign-up', {
     method: 'POST',
     body: JSON.stringify({
       event: 'user_signed_up',
       user_id: authData.user.id,
       email, fullName, phoneNumber,
       timestamp: new Date().toISOString(),
       status: 'success',
     }),
   });
   ```

6. **Redirect to Sign In**:
   ```typescript
   navigate('/signin?message=check-email');
   ```

### Dashboard Access Blocked
- Email must be confirmed before dashboard access
- Sign In checks `email_confirmed_at` field
- Unconfirmed users cannot access protected routes

---

## 5️⃣ SIGN IN GUARDS

### Email Confirmation Check
**Location**: `src/contexts/AuthContext.tsx` → `signIn()`

```typescript
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // ✅ EMAIL CONFIRMATION GUARD
  if (data.user && !data.user.email_confirmed_at) {
    await supabase.auth.signOut();  // Immediately sign out
    throw new Error(
      'Your email is not confirmed. Please check your inbox and click the confirmation link.'
    );
  }

  console.log('[SignIn] Success - email confirmed at:', data.user?.email_confirmed_at);
  return { error: null };
};
```

### Guard Behavior
1. User attempts sign in with credentials
2. If credentials valid but email not confirmed:
   - Session immediately terminated
   - User signed out
   - Clear error message displayed
3. If email confirmed:
   - Sign in proceeds normally
   - Session created and persisted

### Error Messages by Scenario
- **`?message=check-email`**: Green banner - "Check your email"
- **`?message=please-confirm`**: Red error - "Please confirm your email before signing in"
- **`?message=verification-failed`**: Red error - "Email verification failed"
- **Email not confirmed on sign in**: "Your email is not confirmed. Please check your inbox..."

### Protected Routes
**Location**: `src/components/ProtectedRoute.tsx`

All dashboard routes require:
- Valid session
- Confirmed email (enforced by sign in guard)
- Active user state

---

## 6️⃣ SESSION PERSISTENCE

### Supabase Configuration
**Location**: `src/lib/supabase.ts`

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,          // ✅ Save to localStorage
    autoRefreshToken: true,         // ✅ Refresh before expiry
    detectSessionInUrl: true,       // ✅ Handle email tokens
    storageKey: 'adstartup-auth-token',  // Custom key
  },
});
```

### Session Lifecycle
- **Access Token**: 1 hour validity (auto-refreshed)
- **Refresh Token**: 30 days validity
- **Storage**: Browser localStorage
- **Encryption**: JWT tokens cryptographically signed
- **Auto-Refresh**: 5 minutes before expiration

### Session Persistence
✅ Survives page refreshes
✅ Survives browser restarts
✅ Synchronized across tabs
✅ Cleared on explicit sign out

### Sign Out
```typescript
const signOut = async () => {
  await supabase.auth.signOut();  // Clears tokens from localStorage
};
```

Then redirect to `/signin`:
```typescript
navigate('/signin');
```

### Session Restoration
1. User opens application
2. `AuthContext` calls `getSession()`
3. If valid token exists in localStorage:
   - Session restored automatically
   - User data loaded
   - Dashboard accessible
4. If no token or expired:
   - User redirected to `/signin`

---

## 7️⃣ FAIL-SAFE CHECKS

### Runtime Validation

#### Domain Validation
```typescript
// src/lib/domainValidation.ts
export function isAllowedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const origin = `${urlObj.protocol}//${urlObj.host}`;
    return ALLOWED_DOMAINS.includes(origin);
  } catch {
    return false;
  }
}
```

#### Redirect Validation
```typescript
export function validateRedirectUrl(url: string): string {
  if (!isAllowedDomain(url)) {
    console.error('[Security] Blocked redirect to non-whitelisted domain:', url);
    return `${PRODUCTION_DOMAIN}/signin`;
  }
  return url;
}
```

### Console Logging
All authentication operations logged with prefixes:
- `[SignUp]` - Sign up flow
- `[SignIn]` - Sign in flow
- `[AuthConfirm]` - Email confirmation
- `[ResetPassword]` - Password reset
- `[DomainValidation]` - Security checks

### Error Detection
Console logs include:
- ✅ Successful operations with checkmarks
- ❌ Failed operations with X marks
- ⚠️ Warning conditions
- 🔒 Security events

### Examples
```typescript
console.log('[SignUp] ✓ Using PRODUCTION domain:', PRODUCTION_DOMAIN);
console.log('[SignUp] ✓ Redirect URL:', emailRedirectTo);
console.log('[SignIn] Success - email confirmed at:', data.user?.email_confirmed_at);
console.warn('[AuthConfirm] ❌ No session or email not confirmed');
console.error('[Security] Blocked redirect to non-whitelisted domain:', url);
```

---

## 8️⃣ FINAL EXPECTED BEHAVIOR

### Complete User Journey

#### 1. Sign Up
```
User fills form → Submits
  ↓
Supabase creates auth.users record
  ↓
Trigger creates users, user_states, profiles records
  ↓
Verification email sent (Adstartup branded)
  ↓
Redirect to /signin?message=check-email
  ↓
Green banner: "Check your email"
```

#### 2. Email Verification
```
User receives email → Clicks confirmation link
  ↓
Redirected to https://ad-startup.com/auth/confirm
  ↓
Page loads → Supabase detects token in URL
  ↓
Session created → email_confirmed_at set
  ↓
Success checkmark displayed
  ↓
After 2 seconds → Redirect to /dashboard
```

#### 3. Session Persistence
```
User in dashboard → Closes browser
  ↓
Opens browser again → Visits site
  ↓
AuthContext loads → getSession() called
  ↓
Valid token found in localStorage
  ↓
Session restored → User data loaded
  ↓
Dashboard accessible immediately
```

#### 4. Sign In
```
User enters credentials → Submits
  ↓
signInWithPassword() validates
  ↓
Check email_confirmed_at field
  ↓
If NOT confirmed:
  - Sign out immediately
  - Show error: "Your email is not confirmed"
  ↓
If confirmed:
  - Session created
  - Smart routing (subscription → brief → dashboard)
  - User logged in successfully
```

#### 5. Sign Out
```
User clicks "Sign Out" → Confirmed
  ↓
supabase.auth.signOut() called
  ↓
Tokens cleared from localStorage
  ↓
Redirect to /signin
  ↓
Protected routes no longer accessible
```

---

## 🚫 PROHIBITED ACTIONS

### NEVER:
- ❌ Use any domain other than `ad-startup.com` in production
- ❌ Allow login before email verification
- ❌ Redirect to localhost in production builds
- ❌ Skip confirmation checks
- ❌ Store passwords in plain text
- ❌ Log sensitive user data
- ❌ Bypass RLS policies
- ❌ Use `window.location.origin` for auth redirects
- ❌ Allow unsigned tokens
- ❌ Trust client-side email confirmation status

### ALWAYS:
- ✅ Use `PRODUCTION_DOMAIN` constant for redirects
- ✅ Check `email_confirmed_at` before sign in
- ✅ Validate redirect URLs against whitelist
- ✅ Log security events to console
- ✅ Use HTTPS in production
- ✅ Enable RLS on all tables
- ✅ Sign out unconfirmed users immediately
- ✅ Provide clear error messages
- ✅ Test complete flow in staging
- ✅ Monitor authentication logs

---

## 🔐 SECURITY CHECKLIST

### Pre-Deployment
- [ ] PRODUCTION_DOMAIN set to `https://ad-startup.com`
- [ ] All redirects use PRODUCTION_DOMAIN constant
- [ ] Email confirmation required for sign in
- [ ] Domain validation guards active
- [ ] RLS enabled on all tables
- [ ] Session persistence configured
- [ ] Auto token refresh enabled
- [ ] Protected routes configured
- [ ] Error messages user-friendly
- [ ] Console logging comprehensive

### Supabase Configuration
- [ ] Email provider enabled
- [ ] Email confirmation required
- [ ] **Leaked password protection enabled** (see `SUPABASE_DASHBOARD_CONFIGURATION.md`)
- [ ] Email template customized (Adstartup branding)
- [ ] Site URL set to `https://ad-startup.com`
- [ ] Redirect URLs whitelisted:
  - `https://ad-startup.com/auth/confirm`
  - `https://ad-startup.com/reset-password`
- [ ] RLS policies tested and restrictive
- [ ] User creation trigger active
- [ ] JWT secret secure
- [ ] Database indexes optimized

### Testing
- [ ] Sign up flow works end-to-end
- [ ] Verification email received and branded
- [ ] Confirmation link redirects correctly
- [ ] Session persists across page refresh
- [ ] Session persists after browser restart
- [ ] Unconfirmed users cannot sign in
- [ ] Sign out clears session completely
- [ ] Protected routes blocked when signed out
- [ ] Error messages display correctly
- [ ] Console logs helpful for debugging

### Monitoring
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Authentication metrics monitored
- [ ] Failed sign-in attempts tracked
- [ ] Email delivery success rate monitored
- [ ] Session expiration alerts set
- [ ] Security logs reviewed regularly

---

## 📋 TESTING PROCEDURES

### 1. Sign Up & Verification
```bash
1. Go to /signup
2. Fill: name@example.com, Test User, +1234567890, password123
3. Submit form
4. ✅ Redirected to /signin with green banner
5. ✅ Check email inbox (may be in spam)
6. ✅ Verify email has Adstartup branding and logo
7. ✅ Click "Confirm Email" button
8. ✅ Redirected to https://ad-startup.com/auth/confirm
9. ✅ See loading spinner
10. ✅ See success checkmark
11. ✅ Automatically redirected to /dashboard after 2s
12. ✅ User name displayed in dashboard header
```

### 2. Session Persistence
```bash
1. Sign in to application
2. Navigate to /dashboard
3. Press F5 to refresh page
4. ✅ Still logged in, user data displayed
5. Close browser completely
6. Reopen browser
7. Navigate to https://ad-startup.com
8. ✅ Still logged in (session restored)
9. ✅ Dashboard accessible immediately
```

### 3. Email Confirmation Guard
```bash
1. Create new account (don't confirm email)
2. Try to sign in with credentials
3. ✅ Error: "Your email is not confirmed..."
4. ✅ Not allowed to access dashboard
5. Go to inbox and confirm email
6. Try to sign in again
7. ✅ Sign in successful
8. ✅ Dashboard accessible
```

### 4. Sign Out
```bash
1. Click "Sign Out" button
2. ✅ Redirected to /signin
3. Try to access /dashboard directly
4. ✅ Redirected back to /signin (protected route)
5. Check localStorage
6. ✅ Auth token removed
```

### 5. Domain Validation
```bash
1. Open browser console
2. Sign up for new account
3. Check console logs
4. ✅ See: "[SignUp] ✓ Using PRODUCTION domain: https://ad-startup.com"
5. ✅ See: "[SignUp] ✓ Redirect URL: https://ad-startup.com/auth/confirm"
6. ✅ No errors about blocked domains
```

---

## 🚨 TROUBLESHOOTING

### Email Not Received
**Symptoms**: User doesn't receive verification email

**Checks**:
1. Check spam/junk folder
2. Verify email provider enabled in Supabase Dashboard
3. Check Supabase logs for email sending errors
4. Verify SMTP configuration (if using custom SMTP)
5. Check email deliverability score

**Fix**:
- Enable email confirmation in Supabase Dashboard
- Configure custom SMTP provider (SendGrid, Mailgun, etc.)
- Whitelist sender email address

### Confirmation Link Broken
**Symptoms**: Clicking email link shows error

**Checks**:
1. Verify URL in email: `https://ad-startup.com/auth/confirm?token=...`
2. Check `/auth/confirm` route exists and is published
3. Check browser console for errors
4. Verify `detectSessionInUrl: true` in Supabase config
5. Check Supabase project URL matches

**Fix**:
- Ensure site deployed at `https://ad-startup.com`
- Verify redirect URL configured in Supabase Dashboard
- Check route is not behind authentication guard

### Session Not Persisting
**Symptoms**: User logged out after page refresh

**Checks**:
1. Check browser localStorage for `adstartup-auth-token`
2. Verify `persistSession: true` in config
3. Check browser settings (localStorage enabled)
4. Check for browser extensions blocking storage
5. Check localStorage quota not exceeded

**Fix**:
- Enable localStorage in browser settings
- Disable privacy-blocking browser extensions
- Clear browser storage and try again

### Cannot Sign In After Confirmation
**Symptoms**: Email confirmed but sign in fails

**Checks**:
1. Check `email_confirmed_at` field in auth.users table
2. Verify user record exists in public.users
3. Check browser console for error messages
4. Verify password is correct

**Fix**:
- Request new confirmation email
- Reset password
- Check RLS policies not blocking sign in

### Redirecting to Wrong Domain
**Symptoms**: Redirected to localhost in production

**Checks**:
1. Check `PRODUCTION_DOMAIN` constant value
2. Verify import statement for `domainValidation.ts`
3. Check `emailRedirectTo` value in sign up
4. Check browser console for security warnings

**Fix**:
- Ensure `PRODUCTION_DOMAIN = 'https://ad-startup.com'`
- Rebuild and redeploy application
- Clear browser cache

---

## 🎯 SUCCESS CRITERIA

### All Requirements Met When:
- ✅ Sign up creates user and sends email
- ✅ Email has Adstartup branding
- ✅ Email confirmation link uses `https://ad-startup.com`
- ✅ Confirmation redirects to `/auth/confirm`
- ✅ Session created after confirmation
- ✅ Dashboard accessible after confirmation
- ✅ Session persists across page refreshes
- ✅ Session persists after browser restart
- ✅ Unconfirmed users cannot sign in
- ✅ Sign out clears session completely
- ✅ No localhost URLs in production
- ✅ All redirects use production domain
- ✅ Console logs show security checks
- ✅ Error messages clear and helpful

---

## 📖 RELATED DOCUMENTATION

- `AUTHENTICATION_GUIDE.md` - Complete implementation guide
- `EMAIL_TEMPLATE_SETUP.md` - Email customization
- `SESSION_MANAGEMENT.md` - Session handling details
- `IMPLEMENTATION_COMPLETE.md` - Final checklist
- `SUPABASE_DASHBOARD_CONFIGURATION.md` - Dashboard settings & password protection

---

**Last Updated**: 2025-12-16
**Security Level**: Production-Ready
**Status**: ✅ All Requirements Implemented
