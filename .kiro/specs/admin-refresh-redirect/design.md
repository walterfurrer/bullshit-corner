# Admin Refresh Redirect Bugfix Design

## Overview

When an authenticated admin user refreshes any `/admin/*` page, the SSR `beforeLoad` guard in `src/routes/_app/admin.tsx` fails to find the admin role in Clerk's session claims because it reads from `sessionClaims.metadata.role` — a path that does not exist in Clerk's default JWT structure. Clerk exposes `publicMetadata` under the key `public_metadata` in session claims (snake_case), not `metadata`. The fix updates the SSR guard to read from the correct path (`sessionClaims.public_metadata?.role`), aligning it with how the CSR guard already successfully reads `user.publicMetadata.role`.

## Glossary

- **Bug_Condition (C)**: A full-page refresh (SSR path) on any `/admin/*` route by an authenticated admin user — the SSR `beforeLoad` guard incorrectly evaluates `sessionClaims.metadata.role` as `undefined` and triggers a redirect to `/`
- **Property (P)**: The SSR guard correctly resolves the admin role from session claims and allows the authenticated admin user to remain on the page
- **Preservation**: All existing redirect behaviors for unauthenticated users, non-admin users, and the `ENABLE_AUTH=false` case must remain unchanged; client-side navigation must continue to work
- **`beforeLoad`**: TanStack Router's route-level hook that runs before a route renders — used here as the SSR auth guard
- **`auth()`**: Clerk's server-side auth helper from `@clerk/tanstack-react-start/server` that returns `{ userId, sessionClaims, ... }`
- **`sessionClaims`**: The decoded JWT payload from Clerk's session token — contains user identity and metadata fields using Clerk's claim naming conventions (snake_case keys like `public_metadata`)
- **`publicMetadata`**: Clerk's user metadata object (set via dashboard or Backend API) — exposed as `user.publicMetadata` on the client and as `public_metadata` in session claims on the server

## Bug Details

### Bug Condition

The bug manifests when an authenticated admin user performs a full-page refresh (triggering SSR) on any `/admin/*` route. The `beforeLoad` guard reads `sessionClaims.metadata.role`, but Clerk's session token JWT does not contain a `metadata` key at the top level — `publicMetadata` is exposed as `public_metadata` (snake_case) in the claims object. This causes the role check to evaluate as `undefined !== 'admin'`, triggering an incorrect redirect to `/`.

**Formal Specification:**
```
FUNCTION isBugCondition(request)
  INPUT: request of type HTTPRequest (full-page navigation triggering SSR)
  OUTPUT: boolean
  
  RETURN request.isSSR = true
         AND request.path MATCHES '/admin/*'
         AND request.user.isAuthenticated = true
         AND request.user.publicMetadata.role = 'admin'
         AND sessionClaims.metadata IS undefined
         AND sessionClaims.public_metadata.role = 'admin'
END FUNCTION
```

### Examples

- **Admin refreshes `/admin/submissions`**: SSR guard reads `sessionClaims.metadata.role` → gets `undefined` → redirects to `/`. Expected: stays on `/admin/submissions`.
- **Admin refreshes `/admin/leaderboard`**: Same mechanism — SSR guard fails, redirects to `/`. Expected: stays on `/admin/leaderboard`.
- **Admin navigates client-side to `/admin/submissions`**: No SSR involved, `useUser()` hook reads `user.publicMetadata.role` correctly → access granted. This path is unaffected.
- **Non-admin refreshes `/admin/submissions`**: SSR guard correctly denies access (role is not `'admin'` regardless of path). This should remain unchanged.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Unauthenticated users performing a full-page refresh on `/admin/*` routes must continue to be redirected to `/`
- Authenticated users whose role is not `'admin'` must continue to be redirected to `/` on both SSR and CSR paths
- When `ENABLE_AUTH` is `false`, all users must continue to be redirected from `/admin/*` to `/`
- Client-side navigation to admin pages by authenticated admin users must continue to work without interruption
- The component-level `useUser()` guard must continue to verify the role via `user.publicMetadata.role` and redirect non-admins

**Scope:**
All inputs that do NOT involve an authenticated admin user performing a full-page refresh on `/admin/*` routes should be completely unaffected by this fix. This includes:
- Unauthenticated requests to admin routes (still redirected)
- Non-admin authenticated requests to admin routes (still redirected)
- Client-side navigations by admin users (already working)
- All non-admin routes (unrelated code paths)
- The `ENABLE_AUTH=false` check (runs before the claims check)

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Incorrect claims path**: The SSR guard reads `(sessionClaims as any)?.metadata?.role` but Clerk's session token JWT exposes `publicMetadata` under the key `public_metadata` (snake_case), not `metadata`. The `metadata` key does not exist at the top level of the claims object, so the expression evaluates to `undefined`.

2. **Inconsistency between SSR and CSR paths**: The CSR path correctly reads `user.publicMetadata.role` (via Clerk's `useUser()` hook which normalizes the key to camelCase), while the SSR path uses the raw JWT claims object where keys follow Clerk's snake_case convention. The original code author likely assumed the same property name would work in both contexts.

3. **No type safety on claims access**: The code casts `sessionClaims` to `any` to bypass TypeScript checking, which hides the incorrect property path at compile time.

## Correctness Properties

Property 1: Bug Condition - SSR Admin Role Resolution

_For any_ full-page refresh request where the user is authenticated and has `publicMetadata.role = 'admin'`, the fixed `beforeLoad` guard SHALL correctly resolve the admin role from `sessionClaims.public_metadata.role` and allow the request to proceed without redirecting.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-Admin Access Denial

_For any_ request where the user is either unauthenticated, does not have `role = 'admin'`, or where `ENABLE_AUTH` is `false`, the fixed `beforeLoad` guard SHALL produce the same redirect-to-`/` behavior as the original code, preserving all existing access control for unauthorized users.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

**File**: `src/routes/_app/admin.tsx`

**Function**: `beforeLoad` (inside `Route` definition)

**Specific Changes**:

1. **Fix the claims path**: Change `(sessionClaims as any)?.metadata?.role` to `(sessionClaims as any)?.public_metadata?.role` — this accesses the correct snake_case key that Clerk uses in the JWT session token.

2. **No other logic changes**: The conditional structure (`if (!userId)` → redirect, role check → redirect) remains identical. Only the property path changes.

3. **CSR path unchanged**: The component-level `useUser()` guard already reads `user.publicMetadata.role` correctly and needs no modification.

4. **No dashboard changes required**: Clerk's default session token already includes `public_metadata` in the claims. No custom session token template is needed.

**Before:**
```typescript
const role = (sessionClaims as any)?.metadata?.role
```

**After:**
```typescript
const role = (sessionClaims as any)?.public_metadata?.role
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that `sessionClaims.metadata` is indeed `undefined` while `sessionClaims.public_metadata.role` contains the correct value.

**Test Plan**: Write tests that mock Clerk's `auth()` return value with realistic session claims (using the correct `public_metadata` structure) and assert that the old code path fails while the new path succeeds.

**Test Cases**:
1. **Admin SSR refresh test**: Mock `auth()` returning `{ userId: 'user_123', sessionClaims: { public_metadata: { role: 'admin' } } }` — old code reads `.metadata.role` → `undefined` → incorrectly redirects (will fail on unfixed code)
2. **Claims structure validation**: Inspect actual `sessionClaims` shape from Clerk to confirm `metadata` is absent and `public_metadata` is present (will confirm root cause)
3. **Multiple admin routes**: Test both `/admin/submissions` and `/admin/leaderboard` refresh paths to confirm the bug is route-independent (will fail on unfixed code)

**Expected Counterexamples**:
- `sessionClaims.metadata` evaluates to `undefined` for all admin users
- The redirect fires for every SSR request to `/admin/*` regardless of actual admin status
- Possible cause confirmed: incorrect property name in claims access

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL request WHERE isBugCondition(request) DO
  result := beforeLoad_fixed(request)
  ASSERT result does NOT throw redirect
  ASSERT request proceeds to route component
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL request WHERE NOT isBugCondition(request) DO
  ASSERT beforeLoad_original(request) = beforeLoad_fixed(request)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It can generate many combinations of authentication state (no user, non-admin user, admin user) and request context (SSR vs CSR, various routes)
- It catches edge cases such as malformed claims objects, missing fields, or unexpected types
- It provides strong guarantees that the redirect behavior is unchanged for all non-admin-SSR cases

**Test Plan**: Observe behavior on UNFIXED code first for unauthenticated users and non-admin users, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Unauthenticated SSR preservation**: Verify that `auth()` returning `{ userId: null }` still triggers a redirect to `/` after the fix
2. **Non-admin SSR preservation**: Verify that `auth()` returning `{ userId: 'user_456', sessionClaims: { public_metadata: { role: 'general_user' } } }` still triggers a redirect to `/`
3. **ENABLE_AUTH=false preservation**: Verify that when the flag is false, the redirect fires before even reaching the claims check
4. **CSR path preservation**: Verify that the component-level `useUser()` guard continues to work unchanged (no code modified in that path)

### Unit Tests

- Test the `beforeLoad` guard with mocked `auth()` responses for admin users (SSR path)
- Test the `beforeLoad` guard with mocked `auth()` for unauthenticated users
- Test the `beforeLoad` guard with mocked `auth()` for non-admin authenticated users
- Test the `ENABLE_AUTH=false` early-return path
- Test edge cases: claims with empty `public_metadata`, claims with `role: null`, claims with missing `public_metadata` entirely

### Property-Based Tests

- Generate random authentication states (`{ userId: string | null, sessionClaims: { public_metadata: { role: string } } }`) and verify that only `role === 'admin'` with valid `userId` avoids the redirect
- Generate random claim shapes (missing keys, wrong types, extra fields) and verify the guard handles them gracefully without crashing
- Generate combinations of `ENABLE_AUTH` flag states and auth states to verify the correct precedence of checks

### Integration Tests

- Full SSR page load of `/admin/submissions` with a valid admin session cookie — verify 200 response (not 302 redirect)
- Full SSR page load of `/admin/leaderboard` with a valid admin session cookie — verify 200 response
- Full SSR page load of `/admin/submissions` with no session — verify redirect to `/`
- Client-side navigation from `/` to `/admin/submissions` with admin session — verify no redirect
