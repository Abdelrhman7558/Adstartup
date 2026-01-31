# 🔧 Supabase Dashboard Configuration Guide

This guide covers critical security and configuration settings that must be enabled in the Supabase Dashboard.

---

## 🔒 CRITICAL: Enable Password Protection

### What is Leaked Password Protection?

Supabase Auth can prevent users from using compromised passwords by checking against the [HaveIBeenPwned](https://haveibeenpwned.com/) database. This database contains over 800 million passwords that have been exposed in data breaches.

**Status**: ⚠️ Currently DISABLED (must be enabled manually)

### Why Enable This?

- Prevents users from using passwords exposed in data breaches
- Reduces account takeover risk by 70%+
- Industry best practice for authentication security
- Zero performance impact on users with strong passwords
- Completely transparent to users with secure passwords

### How to Enable

1. **Navigate to Supabase Dashboard**:
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Go to Authentication Settings**:
   - Click "Authentication" in left sidebar
   - Click "Providers" tab
   - Scroll to "Email" provider

3. **Enable Password Protection**:
   - Find "Enable leaked password protection" checkbox
   - ✅ Check the box to enable
   - Click "Save" at the bottom

4. **Verify Configuration**:
   ```bash
   # Try to sign up with a known breached password
   # Example: "password123" (commonly breached)
   # Expected result: Error message preventing signup
   ```

### What Happens When Enabled?

**During Sign Up**:
- User submits registration form
- Supabase checks password against HaveIBeenPwned API
- If password found in breach database:
  - Sign up rejected with clear error
  - User prompted to choose different password
- If password not found:
  - Sign up proceeds normally

**During Password Reset**:
- Same validation applies
- Prevents users from resetting to breached password
- Encourages stronger password selection

### User Experience

**For Users with Strong Passwords**:
- ✅ No impact
- ✅ No delays
- ✅ Sign up/reset works normally

**For Users with Breached Passwords**:
- ❌ Sign up/reset rejected
- 💬 Clear error message: "This password has been exposed in a data breach. Please choose a different password."
- 🔄 User can immediately retry with stronger password

### Implementation Status

✅ **Backend Ready**: Supabase Auth handles all validation automatically
✅ **Frontend Ready**: Error handling already implemented in `AuthContext.tsx`
✅ **Migration Applied**: Database optimizations complete
⚠️ **Dashboard Setting**: Must be enabled manually (cannot be automated)

### Error Handling in Code

The application already handles this error gracefully:

```typescript
// src/contexts/AuthContext.tsx
const signUp = async (email: string, password: string, fullName: string, phoneNumber: string) => {
  try {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      // ... other options
    });

    if (signUpError) {
      // This will catch leaked password errors
      console.error('[SignUp] Auth error:', signUpError.message);
      throw signUpError;
    }

    // ... rest of sign up flow
  } catch (error) {
    return { error: error as Error };
  }
};
```

**Error Message Example**:
```
Error: Password has appeared in a data breach.
Please use a different password.
```

This error is automatically displayed to the user in the sign-up form.

---

## 📧 Email Template Configuration

### Confirmation Email Template

**Location**: Authentication → Email Templates → "Confirm signup"

**Required Changes**:
1. **Subject**: "Welcome to Adstartup! Confirm your email"
2. **Logo**: Upload Adstartup logo
3. **Colors**: Match brand colors
4. **Confirmation URL**: Verify uses `{{ .ConfirmationURL }}`

**Example Template**:
```html
<h2>Welcome to Adstartup!</h2>
<p>Thanks for signing up. Please confirm your email address to get started.</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>This link expires in 24 hours.</p>
```

See `EMAIL_TEMPLATE_SETUP.md` for detailed template customization.

---

## 🌐 URL Configuration

### Site URL

**Location**: Authentication → URL Configuration → Site URL

**Production Setting**:
```
https://ad-startup.com
```

**Important**:
- This is the base URL for all auth redirects
- Must match your production domain exactly
- No trailing slash

### Redirect URLs

**Location**: Authentication → URL Configuration → Redirect URLs

**Required URLs**:
```
https://ad-startup.com/**
https://ad-startup.com/auth/confirm
https://ad-startup.com/reset-password
https://ad-startup.com/dashboard
```

**Why Wildcard `/**`?**:
- Allows authentication to any route
- Necessary for dynamic routing in single-page apps
- Still secure due to token validation

---

## ⚙️ General Auth Settings

### Email Confirmation

**Location**: Authentication → Settings

**Required Settings**:
- ✅ **Enable email confirmations**: YES
- ✅ **Require email verification before sign in**: YES
- ✅ **Enable double opt-in**: YES (recommended)

### Session Settings

**Default Values** (do not change unless necessary):
- Access Token Lifetime: 1 hour
- Refresh Token Lifetime: 30 days
- Refresh Token Rotation: Enabled
- Reuse Interval: 10 seconds

### Password Requirements

**Minimum Password Length**: 8 characters (default)

**Recommendations**:
- Minimum 10 characters (better security)
- No maximum length limit
- Allow all special characters
- No complexity requirements (length + breach check is sufficient)

---

## 🔐 Security Best Practices

### RLS Policies

**Already Configured**:
- ✅ RLS enabled on all tables
- ✅ Restrictive policies (authenticated users only)
- ✅ Optimized with subquery pattern
- ✅ Ownership checks on all operations

**Verification**:
```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;

-- Should return 0 rows (all tables have RLS)
```

### API Keys

**Never Expose**:
- ❌ Service Role Key (server-side only)
- ❌ JWT Secret

**Safe to Expose**:
- ✅ Anon/Public Key (client-side)
- ✅ Project URL

**In Code**:
```typescript
// .env (NEVER commit to git)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx  // Safe for client-side
```

### Database Indexes

**Already Optimized**:
- ✅ Foreign key indexes created where needed
- ✅ Unused indexes removed
- ✅ Write performance improved
- ✅ Storage overhead reduced

**Migration Applied**: `fix_indexes_and_performance.sql`

---

## 📊 Monitoring & Logs

### Authentication Logs

**Location**: Authentication → Logs

**Monitor For**:
- Failed sign-in attempts (potential brute force)
- Unusual sign-up patterns
- Email delivery failures
- Token refresh errors

**Set Up Alerts** (recommended):
- 5+ failed logins from same IP in 1 minute
- Email delivery failure rate > 10%
- Unusual sign-up spike (possible bot attack)

### Database Logs

**Location**: Database → Logs

**Monitor For**:
- Slow queries (> 1 second)
- Connection pool exhaustion
- RLS policy violations
- Migration failures

### API Usage

**Location**: Settings → Usage

**Monitor**:
- Database size (storage limits)
- Bandwidth usage
- Concurrent connections
- API request rate

---

## 🚀 Pre-Production Checklist

### Authentication
- [ ] Email provider enabled
- [ ] **Leaked password protection enabled** ⚠️ CRITICAL
- [ ] Email confirmation required
- [ ] Email template customized with branding
- [ ] Site URL set to production domain
- [ ] Redirect URLs whitelisted

### Security
- [ ] RLS enabled on all tables
- [ ] Service role key never exposed in client
- [ ] HTTPS enforced in production
- [ ] SSL certificate valid
- [ ] CORS configured correctly

### Database
- [ ] All migrations applied successfully
- [ ] Foreign key indexes created
- [ ] Unused indexes removed
- [ ] RLS policies optimized
- [ ] Triggers active and tested

### Monitoring
- [ ] Authentication logs reviewed
- [ ] Database performance metrics checked
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Uptime monitoring enabled
- [ ] Alert thresholds configured

---

## 🔧 Troubleshooting

### Password Protection Issues

**Problem**: Users can't sign up
**Check**:
1. Is password on breached list? (Try different password)
2. Check Supabase logs for specific error
3. Verify feature is enabled in Dashboard

**Problem**: Feature not working after enabling
**Solution**:
1. Clear browser cache
2. Wait 1-2 minutes for settings to propagate
3. Try incognito/private browsing mode
4. Check Supabase status page

### Email Delivery Issues

**Problem**: Confirmation emails not received
**Check**:
1. Spam/junk folder
2. Email provider enabled in Dashboard
3. Supabase logs for delivery errors
4. SMTP configuration (if using custom provider)

**Solution**:
- Use custom SMTP provider (SendGrid, Mailgun, AWS SES)
- Configure SPF/DKIM records for domain
- Whitelist sender email address

### URL Redirect Issues

**Problem**: Confirmation link redirects to wrong URL
**Check**:
1. Site URL in Dashboard matches production domain
2. Redirect URLs include confirmation route
3. Code uses `PRODUCTION_DOMAIN` constant
4. No localhost references in production build

**Solution**:
- Update Site URL to `https://ad-startup.com`
- Add `https://ad-startup.com/**` to redirect URLs
- Rebuild and redeploy application

---

## 📖 Related Documentation

- `SECURITY_REQUIREMENTS.md` - Security enforcement details
- `AUTHENTICATION_GUIDE.md` - Implementation guide
- `EMAIL_TEMPLATE_SETUP.md` - Email customization
- `DEPLOYMENT_READY.md` - Pre-deployment checklist

---

## 🆘 Support Resources

### Supabase Documentation
- [Authentication](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Password Protection](https://supabase.com/docs/guides/auth/passwords)

### HaveIBeenPwned
- [API Documentation](https://haveibeenpwned.com/API/v3)
- [About Pwned Passwords](https://haveibeenpwned.com/Passwords)
- [Privacy & Security](https://haveibeenpwned.com/FAQs)

---

## ⚡ Quick Setup Steps

### Enable Password Protection (5 minutes)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click "Authentication" → "Providers"
4. Scroll to "Email" provider
5. ✅ Enable "leaked password protection"
6. Click "Save"
7. Test with known breached password (e.g., "password123")
8. ✅ Sign up should be rejected with clear error

**That's it!** Your application now has industry-leading password security.

---

**Last Updated**: 2025-12-16
**Priority**: 🔴 CRITICAL
**Time Required**: 5 minutes
**Complexity**: Low (checkbox in Dashboard)
**Impact**: High (significantly improves security)

---

## ✅ Summary

**What You Need to Do**:
1. ✅ Enable leaked password protection in Supabase Dashboard (5 min)
2. ✅ Customize email templates with branding (10 min)
3. ✅ Verify Site URL and Redirect URLs (2 min)
4. ✅ Test complete authentication flow (5 min)

**What's Already Done**:
- ✅ Database migrations applied
- ✅ Indexes optimized
- ✅ RLS policies configured
- ✅ Code error handling implemented
- ✅ Frontend ready for all error scenarios

**Total Setup Time**: ~20 minutes
**Security Improvement**: Significant

🔒 **Enable password protection today to protect your users!**
