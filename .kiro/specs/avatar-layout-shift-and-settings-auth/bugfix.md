# Bugfix Requirements Document

## Introduction

Two related UX/reliability bugs in the Bullshit Corner app's authenticated user experience:

1. **Avatar layout shift** — When a signed-in user loads or refreshes any page, the site header visibly shifts as the avatar renders late (after Clerk's client-side auth state resolves). This causes a Cumulative Layout Shift (CLS) regression in the header.

2. **Settings route auth crash** — When a signed-in user navigates to `/settings` via a client-side link (e.g., from the user menu dropdown), the app throws "Cannot read properties of undefined (reading 'auth')" because the route's `beforeLoad` guard calls the server-only `auth()` function from `@clerk/tanstack-react-start/server`, which has no request context during SPA transitions.

Both bugs affect signed-in users and degrade the core authenticated navigation flow.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a signed-in user loads or refreshes a page THEN the system renders the header nav links immediately but delays rendering the avatar/user-menu until Clerk's auth state resolves on the client, causing a visible layout shift in the header area.

1.2 WHEN a signed-out user loads a page THEN the system renders the "Sign In" button simultaneously with the nav links (no layout shift), creating an inconsistent loading experience compared to signed-in users.

1.3 WHEN a signed-in user performs a client-side navigation to `/settings` (e.g., clicking "Settings" in the user menu dropdown) THEN the system throws a runtime error "Cannot read properties of undefined (reading 'auth')" because the `beforeLoad` guard invokes the server-only `auth()` function without a server request context.

1.4 WHEN a signed-in user directly loads `/settings` via full page load (SSR) THEN the system correctly authenticates and renders the settings page, demonstrating the bug is specific to client-side navigation.

### Expected Behavior (Correct)

2.1 WHEN a signed-in user loads or refreshes a page THEN the system SHALL reserve a fixed-size placeholder in the header's auth area while Clerk's auth state is loading, preventing any layout shift regardless of eventual auth outcome.

2.2 WHEN a signed-out user loads a page THEN the system SHALL display the "Sign In" button without layout shift, matching the current (already correct) behavior.

2.3 WHEN a signed-in user performs a client-side navigation to `/settings` THEN the system SHALL successfully authenticate the user using a client-compatible auth check and render the settings page without errors.

2.4 WHEN a signed-in user directly loads `/settings` via full page load (SSR) THEN the system SHALL continue to authenticate and render the settings page correctly.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a signed-out user (unauthenticated) navigates to `/settings` via any method THEN the system SHALL CONTINUE TO redirect them to the home page.

3.2 WHEN a signed-in user clicks nav links other than "Settings" (e.g., "Home", "Submit a Topic") THEN the system SHALL CONTINUE TO navigate without errors.

3.3 WHEN a signed-in user opens the user menu dropdown THEN the system SHALL CONTINUE TO display the menu items ("Your Submissions", "Settings", "Sign Out") correctly.

3.4 WHEN a signed-in user clicks "Sign Out" from the user menu THEN the system SHALL CONTINUE TO sign them out and update the header accordingly.

3.5 WHEN a signed-in user is on the settings page and Clerk's `auth()` is called inside `createServerFn` handlers (e.g., `getAccountDetails`) THEN the system SHALL CONTINUE TO execute those server functions correctly on the server.

3.6 WHEN the page is rendered during SSR with auth state available THEN the system SHALL CONTINUE TO render the correct header content (avatar for signed-in, sign-in button for signed-out) without a loading placeholder.

---

## Bug Condition Derivation

### Bug 1: Avatar Layout Shift

```pascal
FUNCTION isBugCondition_LayoutShift(X)
  INPUT: X of type PageLoadEvent
  OUTPUT: boolean

  // The bug triggers when a signed-in user's page load/refresh causes
  // Clerk auth state to resolve asynchronously on the client
  RETURN X.userIsSignedIn = true AND X.isClientSideHydration = true
END FUNCTION
```

```pascal
// Property: Fix Checking - No Layout Shift
FOR ALL X WHERE isBugCondition_LayoutShift(X) DO
  headerLayout ← renderHeader(X)
  ASSERT headerLayout.authAreaWidth_beforeAuthResolves = headerLayout.authAreaWidth_afterAuthResolves
END FOR
```

```pascal
// Property: Preservation Checking - Signed-out unchanged
FOR ALL X WHERE NOT isBugCondition_LayoutShift(X) DO
  ASSERT renderHeader(X) = renderHeader'(X)
END FOR
```

### Bug 2: Settings Auth Crash

```pascal
FUNCTION isBugCondition_SettingsAuth(X)
  INPUT: X of type NavigationEvent
  OUTPUT: boolean

  // The bug triggers when navigating to /settings via client-side transition
  RETURN X.targetRoute = "/settings" AND X.isClientSideNavigation = true
END FUNCTION
```

```pascal
// Property: Fix Checking - No Auth Crash on Client Navigation
FOR ALL X WHERE isBugCondition_SettingsAuth(X) DO
  result ← navigateToSettings'(X)
  ASSERT no_crash(result) AND (X.userIsSignedIn → result.rendersSettingsPage)
END FOR
```

```pascal
// Property: Preservation Checking - SSR and redirect behavior unchanged
FOR ALL X WHERE NOT isBugCondition_SettingsAuth(X) DO
  ASSERT navigateToSettings(X) = navigateToSettings'(X)
END FOR
```
