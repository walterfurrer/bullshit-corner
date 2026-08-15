# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Avatar Layout Shift & Settings Auth Crash
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate both bugs exist
  - **Scoped PBT Approach**: Scope properties to concrete failing cases:
    - Bug 1: Render `SiteHeader` with `useAuth()` returning `{ isLoaded: false }` — assert the auth area renders a placeholder element with non-zero dimensions (size-8 = 32×32px). On unfixed code, `<Show>` renders nothing during loading → test FAILS.
    - Bug 2: Invoke the settings route's `beforeLoad` in a client-side context (`typeof window !== 'undefined'`, no server request object) — assert it completes without throwing. On unfixed code, `auth()` crashes → test FAILS.
  - Bug Condition from design:
    - `isBugCondition_LayoutShift(X)`: X.userIsSignedIn = true AND X.isClientSideHydration = true
    - `isBugCondition_SettingsAuth(X)`: X.targetRoute = "/settings" AND X.isClientSideNavigation = true
  - Expected Behavior (what the test asserts):
    - Header auth area has stable dimensions (≥32×32px placeholder) during loading state
    - Settings `beforeLoad` does not throw on client-side navigation
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bugs exist)
  - Document counterexamples found (e.g., "auth area has 0×0 dimensions during loading", "beforeLoad throws TypeError on client")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.3, 2.1, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Bug-Condition Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (cases where isBugCondition returns false):
    - Signed-out user: header renders "Sign In" button immediately without layout shift
    - SSR render: header renders correct auth content directly (no placeholder needed)
    - Settings route SSR: `beforeLoad` calls `auth()` successfully on server (typeof window === 'undefined')
    - Settings route unauthenticated: `beforeLoad` redirects to `/` when userId is null
    - Nav links: clicking "Home", "Submit a Topic" navigates without errors
    - User menu: dropdown renders items correctly for signed-in users
    - Sign out: signOut() triggers correctly from dropdown
  - Write property-based tests capturing observed behavior:
    - For all auth states where `isLoaded: true && isSignedIn: false`, header renders SignInButton
    - For all auth states where `isLoaded: true && isSignedIn: true`, header renders UserMenu/Avatar
    - For all server-side contexts (typeof window === 'undefined'), settings `beforeLoad` calls `auth()` and redirects if no userId
    - For all navigation events to non-settings routes, no crash occurs regardless of environment
  - Verify tests pass on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix for Avatar Layout Shift & Settings Auth Crash

  - [x] 3.1 Fix site-header.tsx — Replace `<Show>` with `useAuth()`-driven rendering
    - Import `useAuth` from `@clerk/tanstack-react-start`
    - Remove the `Show` import from `@clerk/tanstack-react-start`
    - Call `const { isLoaded, isSignedIn } = useAuth()` in `SiteHeader`
    - Replace desktop auth area (`<Show when="signed-out">...</Show>` + `<Show when="signed-in">...</Show>`) with:
      - If `!isLoaded`: render `<div className="size-8 rounded-full bg-muted animate-pulse" />` (skeleton placeholder matching avatar dimensions)
      - If `isLoaded && isSignedIn`: render `<UserMenu />`
      - If `isLoaded && !isSignedIn`: render `<SignInButton mode="modal"><Button variant="outline" size="sm">Sign in</Button></SignInButton>`
    - Replace mobile auth area (`<Show when="signed-in">...</Show>` before hamburger) with same loading/signed-in conditional
    - Replace mobile dropdown auth item (`<Show when="signed-out">...</Show>`) with conditional on `isLoaded && !isSignedIn`
    - _Bug_Condition: isBugCondition_LayoutShift(X) where X.userIsSignedIn = true AND X.isClientSideHydration = true_
    - _Expected_Behavior: headerLayout.authAreaWidth_beforeAuthResolves = headerLayout.authAreaWidth_afterAuthResolves (stable dimensions via placeholder)_
    - _Preservation: Signed-out rendering, SSR rendering, mobile menu behavior all unchanged_
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.2, 3.3, 3.4, 3.6_

  - [x] 3.2 Fix settings.tsx — Wrap `auth()` in server-only guard
    - In `beforeLoad`, wrap the `auth()` call with `if (typeof window === 'undefined')` so it only executes during SSR
    - On client-side navigation (typeof window !== 'undefined'), skip the auth guard entirely — the SettingsPage component already returns `null` if user is not loaded/authenticated
    - Keep the `ENABLE_AUTH` check and its redirect logic intact (runs in both environments)
    - Keep the `auth` import (still needed for the SSR path)
    - Resulting `beforeLoad`:
      ```
      beforeLoad: async () => {
        if (!ENABLE_AUTH) throw redirect({ to: '/' })
        if (typeof window === 'undefined') {
          const { userId } = await auth()
          if (!userId) throw redirect({ to: '/' })
        }
      }
      ```
    - _Bug_Condition: isBugCondition_SettingsAuth(X) where X.targetRoute = "/settings" AND X.isClientSideNavigation = true_
    - _Expected_Behavior: no_crash(result) AND settings page renders for authenticated users_
    - _Preservation: SSR auth guard still active, unauthenticated redirect preserved, server functions unchanged_
    - _Requirements: 1.3, 1.4, 2.3, 2.4, 3.1, 3.5_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Avatar Layout Shift & Settings Auth Crash Fixed
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (stable header dimensions, no crash on client nav)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bugs are fixed)
    - _Requirements: 2.1, 2.3_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Bug-Condition Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions in signed-out flow, SSR, redirects, nav links, user menu, sign out)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
