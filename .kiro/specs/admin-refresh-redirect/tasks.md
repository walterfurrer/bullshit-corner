# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - SSR Admin Role Resolution Fails on Refresh
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case — an authenticated admin user (with `public_metadata.role = 'admin'` in session claims) hitting the SSR `beforeLoad` guard
  - Test that the `beforeLoad` guard, when `auth()` returns `{ userId: 'user_admin', sessionClaims: { public_metadata: { role: 'admin' } } }`, does NOT throw a redirect (expected behavior)
  - On UNFIXED code, the guard reads `sessionClaims.metadata.role` → `undefined` → incorrectly redirects
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists because `metadata` is undefined)
  - Document counterexample: `sessionClaims.metadata` is `undefined`, causing redirect for legitimate admin users on SSR refresh
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Admin and Unauthenticated Access Denial
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `auth()` returning `{ userId: null }` triggers redirect to `/` on unfixed code
  - Observe: `auth()` returning `{ userId: 'user_456', sessionClaims: { public_metadata: { role: 'general_user' } } }` triggers redirect to `/` on unfixed code
  - Observe: `ENABLE_AUTH = false` triggers redirect to `/` before any claims check on unfixed code
  - Write property-based test: for all inputs where user is unauthenticated, or role is not `'admin'`, or `ENABLE_AUTH` is false, the guard throws a redirect to `/`
  - Verify tests pass on UNFIXED code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix SSR admin role resolution on page refresh

  - [x] 3.1 Apply the one-line fix in `src/routes/_app/admin.tsx`
    - Change `(sessionClaims as any)?.metadata?.role` to `(sessionClaims as any)?.public_metadata?.role`
    - This aligns the SSR path with Clerk's actual JWT claims structure (snake_case `public_metadata` key)
    - _Bug_Condition: isBugCondition(request) where request.isSSR AND user.publicMetadata.role = 'admin' AND sessionClaims.metadata is undefined_
    - _Expected_Behavior: SSR guard reads sessionClaims.public_metadata.role = 'admin' and does NOT redirect_
    - _Preservation: Unauthenticated users, non-admin users, and ENABLE_AUTH=false all still redirect to /_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - SSR Admin Role Resolution Succeeds
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (admin user on SSR path is NOT redirected)
    - When this test passes, it confirms the bug is fixed
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Admin Access Denial
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all non-admin/unauthenticated redirect behavior is unchanged

- [x] 4. Verify build passes
  - Run `pnpm build` and confirm no type errors or build failures
  - The fix is a single property path change — no structural or type changes

- [x] 5. Manual verification — SSR refresh on admin pages
  - Start dev server with `pnpm dev`
  - Log in as an admin user
  - Navigate to `/admin/submissions` via client-side navigation (should work — baseline)
  - Perform a full-page refresh (Cmd+R / F5) on `/admin/submissions` — should stay on page (not redirect to `/`)
  - Navigate to `/admin/leaderboard` and perform a full-page refresh — should stay on page
  - Verify non-admin user is still redirected on refresh of `/admin/*` routes

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
