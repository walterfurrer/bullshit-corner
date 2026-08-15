# Avatar Layout Shift & Settings Auth Crash — Bugfix Design

## Overview

Two bugs degrade the signed-in user experience in Bullshit Corner:

1. **Avatar layout shift** — Clerk's `<Show when="signed-in">` / `<Show when="signed-out">` in the site header render nothing while auth state is loading, causing a visible CLS jump when the avatar eventually appears.
2. **Settings route auth crash** — The `/settings` route's `beforeLoad` calls `auth()` from `@clerk/tanstack-react-start/server`, which only has a request context during SSR. Client-side navigations crash with "Cannot read properties of undefined (reading 'auth')".

The fix stabilizes the header layout with a loading placeholder and replaces the server-only auth guard with a dual-environment pattern that works during both SSR and SPA navigation.

## Glossary

- **Bug_Condition (C)**: The input/environment state that triggers each bug — (1) signed-in user + client hydration renders no auth area content, (2) client-side navigation to `/settings` invokes server-only `auth()`
- **Property (P)**: Desired behavior — (1) stable header dimensions regardless of auth state, (2) settings route loads without error on both server and client
- **Preservation**: Existing behaviors that must remain unchanged — sign-out button, user menu, SSR rendering, unauthenticated redirect
- **`<Show>`**: Clerk's conditional component that renders children only when the auth state matches `when="signed-in"` or `when="signed-out"`; renders nothing during loading
- **`auth()`**: `@clerk/tanstack-react-start/server` function that reads auth from the server request context; throws when no request context exists (client-side navigation)
- **`useAuth()`**: Client-side Clerk hook returning `{ isLoaded, isSignedIn, userId }` — safe to call anywhere in the React tree
- **`beforeLoad`**: TanStack Router lifecycle that runs before a route renders; executes on both server (SSR) and client (SPA nav)
- **CLS**: Cumulative Layout Shift — a Core Web Vital measuring visual instability during page load

## Bug Details

### Bug Condition

The two bugs manifest under distinct but related conditions affecting signed-in users.

**Bug 1 — Avatar Layout Shift:**
The bug triggers on any page load/refresh when a signed-in user's auth state hasn't resolved yet. The `<Show when="signed-in">` component renders nothing until Clerk's client-side state is hydrated, leaving a gap where the avatar will eventually appear.

**Bug 2 — Settings Auth Crash:**
The bug triggers when a signed-in user navigates to `/settings` via a client-side transition (e.g., clicking "Settings" in the user menu dropdown). The `beforeLoad` hook runs on the client and calls `auth()` which requires server request context.

**Formal Specification:**
```
FUNCTION isBugCondition_LayoutShift(input)
  INPUT: input of type PageRenderEvent
  OUTPUT: boolean

  RETURN input.userIsSignedIn = true
         AND input.clerkAuthStateLoaded = false
         AND input.isClientSideHydration = true
END FUNCTION

FUNCTION isBugCondition_SettingsAuth(input)
  INPUT: input of type NavigationEvent
  OUTPUT: boolean

  RETURN input.targetRoute = "/settings"
         AND input.isClientSideNavigation = true
END FUNCTION
```

### Examples

- **Layout shift**: Signed-in user refreshes the homepage → header nav links render immediately, auth area is empty for ~200-500ms, then avatar pops in causing content to shift left
- **Layout shift (SSR)**: Same page load on server render → auth state is available, avatar renders in the initial HTML (no shift) — inconsistency with client hydration
- **Settings crash**: User clicks "Settings" in the dropdown menu → `TypeError: Cannot read properties of undefined (reading 'auth')` → app shows error boundary
- **Settings SSR (no bug)**: User navigates directly to `bscorner.com/settings` → full page load, `auth()` works fine since there's a server request context → settings page renders correctly

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Mouse clicks on nav links ("Home", "Submit a Topic") must continue to navigate without errors
- The user menu dropdown must continue to display all items and function correctly
- "Sign Out" must continue to sign the user out and update the header
- Unauthenticated users navigating to `/settings` must continue to be redirected to `/`
- Server functions (`getAccountDetails`, `requestEmailChange`, etc.) in `src/server/account.ts` must continue to use `auth()` successfully since they run exclusively on the server
- SSR renders must continue to show the correct auth content without a loading placeholder (avatar for signed-in, sign-in button for signed-out)
- The "Sign in" button for signed-out users must continue to appear without layout shift (already works correctly)
- The mobile menu's auth behavior must continue to work identically

**Scope:**
All inputs that do NOT involve (1) client-side hydration of the auth area or (2) client-side navigation to `/settings` should be completely unaffected by this fix. This includes:
- All signed-out user flows
- All SSR/full-page-load flows
- All server function invocations
- All non-settings client-side navigations
- Mobile menu open/close and navigation

## Hypothesized Root Cause

Based on the bug descriptions and code analysis:

### Bug 1 — Layout Shift

1. **`<Show>` component renders nothing during loading**: Clerk's `<Show when="signed-in">` renders its children only after auth state loads. During the indeterminate loading period (between initial render and Clerk hydration), neither `<Show when="signed-in">` nor `<Show when="signed-out">` renders anything, leaving the auth area with zero dimensions.

2. **No reserved space in layout**: The header uses `flex` with `items-center` and `gap-6`. When the auth area is empty, the other flex children (nav links) fill the available space. Once the avatar (32×32px `size-8`) pops in, content shifts.

3. **SSR-to-client mismatch**: During SSR, Clerk has auth state available (from the request) so `<Show>` renders correctly. On hydration, the client-side Clerk state starts as "loading" before matching the server's state — the brief loading window is the CLS culprit.

### Bug 2 — Settings Auth Crash

1. **Direct `auth()` call in `beforeLoad`**: The `settings.tsx` route imports `auth` from `@clerk/tanstack-react-start/server` and calls it directly in `beforeLoad`. This function accesses the HTTP request context via `getWebRequest()` under the hood.

2. **No request context on client**: During a client-side navigation, TanStack Router runs `beforeLoad` in the browser. There is no HTTP request object available — `getWebRequest()` returns undefined, and accessing `.auth` on undefined throws.

3. **Pattern mismatch with root route**: The root route (`__root.tsx`) correctly wraps its `auth()` call inside `createServerFn`, which ensures it only executes on the server. The settings route calls `auth()` directly without this protection.

4. **The correct pattern**: Auth guards in TanStack Start child routes should either (a) pass auth state through router context from a parent route's server function, or (b) use a client-compatible check that works in both environments.

## Correctness Properties

Property 1: Bug Condition (Layout Shift) — Header Auth Area Has Stable Dimensions

_For any_ page render event where a signed-in user's auth state has not yet loaded on the client (isBugCondition_LayoutShift returns true), the header auth area SHALL render a placeholder element with dimensions matching the avatar (size-8 = 32×32px), preventing any layout shift when the actual auth content replaces it.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition (Settings Auth) — Client-Side Settings Navigation Succeeds

_For any_ navigation event targeting `/settings` via client-side transition (isBugCondition_SettingsAuth returns true), the route's `beforeLoad` SHALL complete without throwing, correctly authenticate the user using a client-compatible method, and either render the settings page (if authenticated) or redirect to `/` (if not).

**Validates: Requirements 2.3, 2.4**

Property 3: Preservation — Non-Bug Inputs Unchanged

_For any_ input where neither bug condition holds (signed-out user flows, SSR loads, non-settings navigation, server function calls), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing navigation, auth, dropdown, sign-out, and redirect functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/components/site-header.tsx`

**Change 1 — Replace `<Show>` with `useAuth()`-driven conditional rendering:**

Replace Clerk's `<Show when="signed-in">` / `<Show when="signed-out">` with explicit conditional logic using `useAuth()` from `@clerk/tanstack-react-start`. This gives us access to `isLoaded` and `isSignedIn` states so we can render a placeholder during loading.

Implementation:
- Import `useAuth` from `@clerk/tanstack-react-start`
- Remove the `Show` import
- Replace `<Show when="signed-in">...<Show when="signed-out">` blocks with:
  - If `!isLoaded`: render a skeleton placeholder (`<div className="size-8 rounded-full bg-muted animate-pulse" />`) — matches avatar dimensions
  - If `isLoaded && isSignedIn`: render `<UserMenu />`
  - If `isLoaded && !isSignedIn`: render the `<SignInButton>` wrapped in `<Button>`

Apply the same pattern to both the desktop auth area and the mobile auth area.

**File**: `src/routes/settings.tsx`

**Change 2 — Replace direct `auth()` call with dual-environment auth guard:**

Remove the direct `auth()` import/call from `beforeLoad`. Instead, use a pattern that works in both SSR and client-side navigation:

- Create a `fetchAuthState` server function using `createServerFn` that calls `auth()` and returns `{ userId }`. This ensures `auth()` only runs on the server.
- In `beforeLoad`: check if we're on the server (via `typeof window === 'undefined'` or by checking if the server function can be invoked). On the server, call the server function. On the client, access Clerk's client-side auth state.

**Recommended approach** — Use `createServerFn` + client fallback:
```
beforeLoad: async ({ context }) => {
  if (!ENABLE_AUTH) throw redirect({ to: '/' })

  // Server-side: call auth() via server function
  if (typeof window === 'undefined') {
    const { userId } = await fetchAuthState()
    if (!userId) throw redirect({ to: '/' })
    return
  }

  // Client-side: Clerk's state is already loaded by this point
  // (user clicked a link while authenticated), so we can rely on
  // the Clerk client state. If somehow not authenticated, redirect.
  // The actual auth check happens client-side via Clerk's loaded state.
  // Since beforeLoad doesn't have access to React hooks, we use a
  // lightweight check: if we reach this route client-side, the user
  // was already authenticated (they clicked from the user menu which
  // only renders for signed-in users). The page component itself
  // already checks isAuthenticated via useConvexAuth and returns null
  // if not authenticated.
}
```

**Alternative (simpler) approach** — Remove `beforeLoad` auth guard entirely for client-side, rely on component-level guard:

The settings page component already has:
```tsx
if (!user) return null
```

And the "Settings" link is only visible to signed-in users (inside `<Show when="signed-in">`/`<UserMenu>`). So the practical approach is:
- Keep the server-side auth guard for SSR (direct URL access protection)
- On the client side, skip the guard since the component already handles the unauthenticated case gracefully

Implementation:
```tsx
beforeLoad: async () => {
  if (!ENABLE_AUTH) throw redirect({ to: '/' })

  // Only run server-side auth check — client-side navigation
  // is already protected by the component (user menu only shows
  // for authenticated users, and the component returns null if
  // user is not loaded)
  if (typeof window === 'undefined') {
    const { userId } = await auth()
    if (!userId) throw redirect({ to: '/' })
  }
}
```

This is the minimal fix: wrap the `auth()` call in a `typeof window === 'undefined'` guard so it only runs during SSR. On client-side navigation, the page component's own auth checks provide the safety net.

**File**: `src/routes/settings.tsx`

**Change 3 — Remove top-level `auth` import side-effects (if any):**

The `auth` import from `@clerk/tanstack-react-start/server` may cause issues if the module has server-only side effects that crash on import in the browser. TanStack Start's bundler should tree-shake server imports in client bundles when used inside `createServerFn`, but a direct import at the top of a route file that runs on both server and client could be problematic. If the `typeof window` guard is sufficient (the import exists but the function is only called on the server), this is fine. If not, wrap the import dynamically or move it into a server function.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate both bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that (1) render the `SiteHeader` component with Clerk in a loading state and measure whether the auth area occupies space, and (2) simulate a client-side navigation to `/settings` and observe the crash.

**Test Cases**:
1. **Header Loading State Test**: Render `SiteHeader` with `useAuth` returning `{ isLoaded: false }` — assert that the auth area has non-zero dimensions (will fail on unfixed code since `<Show>` renders nothing)
2. **Header Signed-In Test**: Render `SiteHeader` with `useAuth` returning `{ isLoaded: true, isSignedIn: true }` — assert avatar renders (should pass on both)
3. **Settings Client Navigation Test**: Invoke the settings route's `beforeLoad` in a client-side context (no request object) — assert no crash (will fail on unfixed code)
4. **Settings SSR Test**: Invoke `beforeLoad` with a valid server context — assert it works (should pass on both)

**Expected Counterexamples**:
- Header auth area has zero width/height during loading state (CLS)
- `beforeLoad` throws TypeError when `auth()` is called without server context
- Possible root causes confirmed: `<Show>` renders nothing during loading; `auth()` requires server request

### Fix Checking

**Goal**: Verify that for all inputs where either bug condition holds, the fixed code produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition_LayoutShift(input) DO
  rendered := renderHeader_fixed(input)
  ASSERT rendered.authAreaElement IS NOT NULL
  ASSERT rendered.authAreaElement.width >= 32
  ASSERT rendered.authAreaElement.height >= 32
END FOR

FOR ALL input WHERE isBugCondition_SettingsAuth(input) DO
  result := settingsBeforeLoad_fixed(input)
  ASSERT no_crash(result)
  ASSERT (input.userIsSignedIn → result.proceeds) AND (NOT input.userIsSignedIn → result.redirectsToHome)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where neither bug condition holds, the fixed code produces the same result as the original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition_LayoutShift(input) AND NOT isBugCondition_SettingsAuth(input) DO
  ASSERT renderHeader_original(input) = renderHeader_fixed(input)
  ASSERT settingsRoute_original(input) = settingsRoute_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (different auth states, navigation methods, user states)
- It catches edge cases that manual unit tests might miss (e.g., race conditions between auth loading and navigation)
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for all non-bug scenarios (signed-out users, SSR loads, mouse clicks, other navigations), then write property-based tests capturing that behavior.

**Test Cases**:
1. **Signed-Out Header Preservation**: Verify "Sign in" button renders immediately without layout shift (already works) — ensure fix doesn't regress this
2. **SSR Auth Preservation**: Verify full-page load of `/settings` with valid auth still works via `auth()` on the server
3. **Unauthenticated Redirect Preservation**: Verify unauthenticated user accessing `/settings` is still redirected to `/`
4. **User Menu Preservation**: Verify dropdown menu items continue to render and function correctly
5. **Nav Links Preservation**: Verify all non-settings nav links continue to work during client-side navigation
6. **Server Function Preservation**: Verify `getAccountDetails` and other server functions in `src/server/account.ts` continue to call `auth()` successfully

### Unit Tests

- Test `SiteHeader` renders placeholder when `useAuth()` returns `isLoaded: false`
- Test `SiteHeader` renders avatar when `useAuth()` returns `isLoaded: true, isSignedIn: true`
- Test `SiteHeader` renders sign-in button when `useAuth()` returns `isLoaded: true, isSignedIn: false`
- Test placeholder dimensions match avatar dimensions (32×32px)
- Test settings `beforeLoad` does not call `auth()` when `typeof window !== 'undefined'`
- Test settings `beforeLoad` calls `auth()` and redirects when on server and unauthenticated
- Test settings `beforeLoad` calls `auth()` and proceeds when on server and authenticated

### Property-Based Tests

- Generate random auth states (`{ isLoaded: bool, isSignedIn: bool }`) and verify header always renders an element with stable dimensions in the auth area
- Generate random navigation contexts (server vs client, authenticated vs not) and verify settings route never crashes
- Generate random sequences of nav interactions (menu open, link click, sign out) and verify all preserve correct behavior after fix

### Integration Tests

- Test full navigation flow: sign in → click "Settings" in dropdown → settings page renders without error
- Test page refresh on `/settings` → SSR auth works, page renders
- Test signed-in page load → no visible layout shift in header (measure CLS if possible)
- Test signed-out user direct-navigates to `/settings` → redirected to `/`
- Test mobile menu auth area has same stable-dimension behavior during loading
