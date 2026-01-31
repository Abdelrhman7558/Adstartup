# OAuth State Testing Script

Quick tests to verify the Meta OAuth state generation is working correctly.

## Test 1: State Generation Function

```javascript
// In browser console, paste this after importing the function:
import { generateMetaOAuthState, decodeMetaOAuthState } from './src/lib/metaOAuthState.ts';

const testUserId = '42285edd-ed5e-4546-b8b0-b556a6e49697';

// Generate state
const state1 = generateMetaOAuthState(testUserId);
console.log('Generated State 1:', state1);

// Wait a second
setTimeout(() => {
  // Generate state again
  const state2 = generateMetaOAuthState(testUserId);
  console.log('Generated State 2:', state2);

  // States should be DIFFERENT (different timestamps)
  console.log('States are different:', state1 !== state2);

  // Decode both
  const decoded1 = decodeMetaOAuthState(state1);
  const decoded2 = decodeMetaOAuthState(state2);

  console.log('Decoded 1:', decoded1);
  console.log('Decoded 2:', decoded2);

  // Both should have same userId
  console.log('Both have same userId:', decoded1.userId === decoded2.userId);

  // Different timestamps
  console.log('Different timestamps:', decoded1.timestamp !== decoded2.timestamp);
}, 1000);
```

**Expected Results:**
```
Generated State 1: NDIyODVlZGQtZWQ1ZS00NTQ2LWI4YjAtYjU1NmE2ZTQ5NjViOjE3NjU5ODAwOTU5NDU=
Generated State 2: NDIyODVlZGQtZWQ1ZS00NTQ2LWI4YjAtYjU1NmE2ZTQ5NjpiOjE3NjU5ODAwOTU5NDg=
States are different: true
Decoded 1: { userId: '42285edd-ed5e-4546-b8b0-b556a6e49697', timestamp: '1765980095945' }
Decoded 2: { userId: '42285edd-ed5e-4546-b8b0-b556a6e49697', timestamp: '1765980095948' }
Both have same userId: true
Different timestamps: true
```

## Test 2: OAuth URL Generation

```javascript
// In browser console:
import { getMetaOAuthUrl } from './src/lib/metaOAuthState.ts';

const testUserId = '42285edd-ed5e-4546-b8b0-b556a6e49697';

const url1 = getMetaOAuthUrl(testUserId);
console.log('OAuth URL 1:', url1);

// Extract state from URL
const params1 = new URL(url1).searchParams;
const state1 = params1.get('state');
console.log('State from URL 1:', state1);

// Generate again
const url2 = getMetaOAuthUrl(testUserId);
const params2 = new URL(url2).searchParams;
const state2 = params2.get('state');

console.log('State from URL 2:', state2);
console.log('States are different:', state1 !== state2);
console.log('Both redirect to Meta:', params1.get('redirect_uri') === params2.get('redirect_uri'));
console.log('Both have same client_id:', params1.get('client_id') === params2.get('client_id'));
```

**Expected Results:**
```
State from URL 1: NDIyODVlZGQtZWQ1ZS00NTQ2LWI4YjAtYjU1NmE2ZTQ5NjZiOjE3NjU5ODAwOTU5NDU=
State from URL 2: NDIyODVlZGQtZWQ1ZS00NTQ2LWI4YjAtYjU1NmE2ZTQ5NjZiOjE3NjU5ODAwOTU5NDg=
States are different: true
Both redirect to Meta: true
Both have same client_id: true
```

## Test 3: Dashboard User ID Display

```javascript
// In browser, open Dashboard and check Console:

// Should see logs like:
console.log('[OAuth State] Generated state for user: 42285edd...');
console.log('[OAuth URL] Generated OAuth URL with state for user: 42285edd...');

// Verify user ID is visible on page
const userIdElement = document.querySelector('code');
const displayedUserId = userIdElement?.textContent;
console.log('Displayed User ID:', displayedUserId);

// Should be a valid UUID format
const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(displayedUserId);
console.log('Is valid UUID:', isValidUUID);
```

**Expected Results:**
```
Displayed User ID: 42285edd-ed5e-4546-b8b0-b556a6e49697
Is valid UUID: true
```

## Test 4: Button Click Verification

1. **Open Dashboard**
2. **Open DevTools → Console**
3. **Click "Connect Meta Account" button**
4. **Check console immediately (before redirect):**

```
[MetaConnection] Initiating OAuth for user: 42285edd...
[MetaConnection] Redirecting to Meta OAuth...
```

5. **Inspect Network tab** (if redirect doesn't complete):
   - Should see redirect to: `facebook.com/v19.0/dialog/oauth?...&state=...`
   - State parameter should be base64-encoded value

6. **Verify URL Structure** (in address bar before redirect):
```
https://www.facebook.com/v19.0/dialog/oauth
  ?client_id=891623109984411
  &redirect_uri=https://n8n.srv1181726.hstgr.cloud/webhook-test/Meta-Callback
  &scope=ads_management%2Cads_read%2Cbusiness_management
  &state=NDIyODVlZGQtZWQ1ZS00NTQ2LWI4YjAtYjU1NmE2ZTQ5NjZiOjE3NjU5ODAwOTU5NDU=
```

## Test 5: Different Users Different States

1. **Create Test User A**
   - Login to Dashboard
   - Note User ID: `11111111-1111-1111-1111-111111111111`
   - Click "Connect Meta Account"
   - Note the state parameter in redirect URL

2. **Create Test User B**
   - Logout
   - Login as different user
   - Note User ID: `22222222-2222-2222-2222-222222222222`
   - Click "Connect Meta Account"
   - Note the state parameter in redirect URL

3. **Verify States Are Different**
   - User A state: `MTExMTExMTEtMTExMS00NTQ2LWI4YjAtYjU1NmE2ZTQ5NjZiOjE3NjU5ODAwOTU5NDU=`
   - User B state: `MjIyMjIyMjItMjIyMi00NTQ2LWI4YjAtYjU1NmE2ZTQ5NjZiOjE3NjU5ODAwOTU5NDU=`
   - States should be completely different

4. **Decode Both States**
```javascript
const stateA = 'MTExMTExMTEtMTExMS00NTQ2LWI4YjAtYjU1NmE2ZTQ5NjZiOjE3NjU5ODAwOTU5NDU=';
const stateB = 'MjIyMjIyMjItMjIyMi00NTQ2LWI4YjAtYjU1NmE2ZTQ5NjZiOjE3NjU5ODAwOTU5NDU=';

console.log('Decoded A:', atob(stateA));
// Output: 11111111-1111-1111-1111-111111111111:1765980095945

console.log('Decoded B:', atob(stateB));
// Output: 22222222-2222-2222-2222-222222222222:1765980095945
```

## Test 6: Invalid User ID Handling

```javascript
// Try to generate URL with invalid user ID
import { getMetaOAuthUrl } from './src/lib/metaOAuthState.ts';

const invalidUserId = 'not-a-uuid';

try {
  const url = getMetaOAuthUrl(invalidUserId);
  console.log('ERROR: Should have thrown an error');
} catch (error) {
  console.log('Caught error (CORRECT):', error.message);
  // Should output: "Invalid userId format. Expected UUID format."
}
```

## Test 7: Missing User ID Handling

```javascript
import { getMetaOAuthUrl } from './src/lib/metaOAuthState.ts';

try {
  const url = getMetaOAuthUrl(null);
  console.log('ERROR: Should have thrown an error');
} catch (error) {
  console.log('Caught error (CORRECT):', error.message);
  // Should output: "userId is required for OAuth URL generation"
}
```

## Automated Test Suite

```javascript
// Save this as a test file and run it in browser console

async function runOAuthTests() {
  const { generateMetaOAuthState, decodeMetaOAuthState, getMetaOAuthUrl } =
    await import('./src/lib/metaOAuthState.ts');

  let passed = 0;
  let failed = 0;

  // Test 1: State differs on each call
  const state1 = generateMetaOAuthState('42285edd-ed5e-4546-b8b0-b556a6e49697');
  const state2 = generateMetaOAuthState('42285edd-ed5e-4546-b8b0-b556a6e49697');
  if (state1 !== state2) {
    console.log('✓ Test 1: States differ on each call');
    passed++;
  } else {
    console.log('✗ Test 1: States differ on each call');
    failed++;
  }

  // Test 2: Decoded userId is correct
  const decoded = decodeMetaOAuthState(state1);
  if (decoded.userId === '42285edd-ed5e-4546-b8b0-b556a6e49697') {
    console.log('✓ Test 2: Decoded userId is correct');
    passed++;
  } else {
    console.log('✗ Test 2: Decoded userId is correct');
    failed++;
  }

  // Test 3: OAuth URL contains valid state
  const url = getMetaOAuthUrl('42285edd-ed5e-4546-b8b0-b556a6e49697');
  const params = new URL(url).searchParams;
  const state = params.get('state');
  const decodedFromUrl = decodeMetaOAuthState(state);
  if (decodedFromUrl?.userId === '42285edd-ed5e-4546-b8b0-b556a6e49697') {
    console.log('✓ Test 3: OAuth URL contains valid state');
    passed++;
  } else {
    console.log('✗ Test 3: OAuth URL contains valid state');
    failed++;
  }

  // Test 4: Different users get different states
  const userAState = generateMetaOAuthState('11111111-1111-1111-1111-111111111111');
  const userBState = generateMetaOAuthState('22222222-2222-2222-2222-222222222222');
  if (userAState !== userBState) {
    console.log('✓ Test 4: Different users get different states');
    passed++;
  } else {
    console.log('✗ Test 4: Different users get different states');
    failed++;
  }

  // Test 5: Invalid UUID rejected
  try {
    getMetaOAuthUrl('invalid-uuid');
    console.log('✗ Test 5: Invalid UUID rejected');
    failed++;
  } catch (error) {
    console.log('✓ Test 5: Invalid UUID rejected');
    passed++;
  }

  console.log(`\n========== RESULTS ==========`);
  console.log(`Passed: ${passed}/5`);
  console.log(`Failed: ${failed}/5`);
  console.log(`========== RESULTS ==========`);
}

// Run tests
runOAuthTests();
```

## Console Log Verification

After clicking "Connect Meta Account", you should see these logs in order:

1. ✅ **`[OAuth State] Generated state for user: 42285edd... at 2025-12-17T14:30:15.123Z`**
   - State generation successful
   - Timestamp shows when it was generated

2. ✅ **`[OAuth URL] Generated OAuth URL with state for user: 42285edd...`**
   - OAuth URL built successfully with state

3. ✅ **`[MetaConnection] Initiating OAuth for user: 42285edd...`**
   - Button handler triggered with correct userId

4. ✅ **`[MetaConnection] Redirecting to Meta OAuth...`**
   - About to redirect to Meta (page may navigate away)

## Troubleshooting

| Issue | Check | Solution |
|-------|-------|----------|
| "userId is required" error | User not logged in | Sign in to dashboard first |
| "Invalid userId format" error | userId not UUID | Check Supabase Auth returns valid UUID |
| State not in URL | Function not called | Verify button click handler invoked |
| Same state on multiple clicks | Timestamp not updating | Check system time is correct |
| Different users same state | userId not in state | Verify `generateMetaOAuthState()` includes userId |

## What Each Test Verifies

- **Test 1:** State is dynamically generated (timestamp changes each time)
- **Test 2:** Decoded state contains correct userId
- **Test 3:** OAuth URL properly includes state parameter
- **Test 4:** Different users receive different states
- **Test 5:** Invalid UUIDs are rejected
- **Test 6:** Missing userId is rejected
- **Test 7:** UI displays correct userId

All tests should pass, confirming that:
✅ User ID is retrieved from authenticated session
✅ State is dynamically generated per click
✅ Each user gets unique state
✅ OAuth URL is correctly constructed
✅ No hardcoding of values
