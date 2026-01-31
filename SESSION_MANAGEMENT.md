# Session Management Documentation

## Overview
Adstartup uses Supabase Auth for secure, persistent session management. Sessions are automatically maintained across page refreshes and browser restarts until the user explicitly logs out.

## How Sessions Work

### Automatic Session Persistence
The Supabase client is configured with the following settings in `src/lib/supabase.ts`:

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // Saves session to localStorage
    autoRefreshToken: true,       // Automatically refreshes expired tokens
    detectSessionInUrl: true,     // Detects auth tokens in URL (for email confirmation)
    storageKey: 'adstartup-auth-token',  // Custom storage key
  },
});
```

### Session Storage
- Sessions are stored in browser `localStorage` under the key `adstartup-auth-token`
- The session includes:
  - Access token (JWT)
  - Refresh token
  - User metadata
  - Expiration time

### Session Lifecycle

#### 1. Sign Up Flow
```
User Signs Up
    ↓
Email Verification Sent
    ↓
User Clicks Confirmation Link
    ↓
Redirected to /auth/confirm
    ↓
Session Created & Stored
    ↓
Redirected to Dashboard
```

#### 2. Sign In Flow
```
User Enters Credentials
    ↓
supabase.auth.signInWithPassword()
    ↓
Session Created & Stored
    ↓
User State Loaded
    ↓
Redirected to Dashboard
```

#### 3. Session Restoration
```
User Visits Site
    ↓
AuthContext Initializes
    ↓
supabase.auth.getSession()
    ↓
Session Retrieved from localStorage
    ↓
User Data Loaded
    ↓
User Stays Logged In
```

#### 4. Sign Out Flow
```
User Clicks Sign Out
    ↓
supabase.auth.signOut()
    ↓
Session Removed from localStorage
    ↓
AuthContext Cleared
    ↓
Redirected to Sign In
```

## AuthContext Implementation

The `AuthContext` manages session state application-wide:

```typescript
// Automatically loads session on mount
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) {
      loadUserData(session.user.id);
    }
  });

  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) {
      loadUserData(session.user.id);
    } else {
      // Clear data on logout
      setProfile(null);
      setSubscription(null);
      setBrief(null);
      setUserState(null);
      setMetaConnection(null);
    }
  });

  return () => subscription.unsubscribe();
}, []);
```

## Protected Routes

Routes are protected using the `ProtectedRoute` component:

```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

If no valid session exists, users are automatically redirected to `/signin`.

## Session Security

### Token Refresh
- Access tokens expire after 1 hour (default)
- Refresh tokens are valid for 30 days (default)
- Tokens are automatically refreshed before expiration
- Failed refresh attempts log the user out

### Security Best Practices
1. ✅ Sessions stored in `localStorage` (not cookies for SPA)
2. ✅ Tokens are JWT-based and cryptographically signed
3. ✅ Auto-refresh prevents session expiration during active use
4. ✅ RLS policies protect data at the database level
5. ✅ HTTPS required in production
6. ✅ No sensitive data stored in localStorage (only tokens)

## Testing Session Persistence

### Test 1: Page Refresh
1. Sign in to the application
2. Navigate to dashboard
3. Refresh the page (F5)
4. ✅ User should remain logged in

### Test 2: Browser Restart
1. Sign in to the application
2. Close the browser completely
3. Reopen the browser and visit the site
4. ✅ User should remain logged in

### Test 3: Multiple Tabs
1. Sign in on Tab 1
2. Open Tab 2 with the same site
3. ✅ Both tabs should show logged-in state
4. Sign out on Tab 1
5. ✅ Tab 2 should automatically sign out

### Test 4: Session Expiration
1. Sign in to the application
2. Wait for token expiration (or manually delete the token)
3. Interact with the application
4. ✅ Token should auto-refresh OR user redirected to sign in

## Troubleshooting

### Session Not Persisting
**Problem**: User is logged out after page refresh

**Solutions**:
- Check browser localStorage is enabled
- Verify `persistSession: true` in Supabase config
- Check for localStorage quota errors
- Verify no browser extensions are clearing storage

### Session Expired Errors
**Problem**: "Session expired" errors appearing

**Solutions**:
- Verify `autoRefreshToken: true` is set
- Check network connectivity
- Verify Supabase project is active
- Check for clock skew on user's device

### Multiple Sessions Issue
**Problem**: User appears logged in on one device but not another

**Solutions**:
- Each device maintains its own session
- Sign in separately on each device
- Use `signOut()` to clear sessions

### Email Confirmation Not Creating Session
**Problem**: After email confirmation, user not logged in

**Solutions**:
- Verify `detectSessionInUrl: true` is set
- Check redirect URL is correct
- Verify `/auth/confirm` route exists
- Check browser console for errors

## Manual Session Management

While sessions are automatic, you can manually manage them:

### Get Current Session
```typescript
const { data: { session }, error } = await supabase.auth.getSession();
if (session) {
  console.log('User is logged in:', session.user.email);
}
```

### Check if User is Authenticated
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  console.log('Authenticated user:', user.id);
}
```

### Refresh Session Manually
```typescript
const { data: { session }, error } = await supabase.auth.refreshSession();
```

### Sign Out
```typescript
await supabase.auth.signOut();
```

## Environment-Specific Behavior

### Development (localhost)
- Sessions work the same as production
- Use `http://localhost:5173` for local testing
- HTTPS not required

### Production
- HTTPS is required for security
- Configure site URL in Supabase dashboard
- Add production domain to redirect URLs
- Consider shorter token expiration for sensitive apps

## Notes

- Never store passwords in localStorage
- Session tokens are encrypted and signed
- RLS policies provide database-level security even if token is compromised
- Users can have multiple active sessions across devices
- Session invalidation is handled by Supabase infrastructure
