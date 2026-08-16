# Bugfix Requirements Document

## Introduction

When an authenticated admin user refreshes any `/admin/*` page (e.g. `/admin/submissions` or `/admin/leaderboard`), the app redirects them to the home page (`/`) instead of staying on the admin page. This only occurs on full-page refresh (SSR path) — client-side navigation works correctly. The root cause is that the SSR `beforeLoad` guard in `src/routes/_app/admin.tsx` reads the admin role from `sessionClaims.metadata.role`, but Clerk's session claims do not expose `publicMetadata` under that path by default. The role is either absent or nested differently in the server-side session claims object, causing the role check to fail and triggering a redirect.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an authenticated admin user performs a full-page refresh on any `/admin/*` route THEN the system redirects them to `/` because the SSR `beforeLoad` guard fails to find the admin role in session claims

1.2 WHEN the SSR `beforeLoad` guard reads `sessionClaims.metadata.role` THEN the system receives `undefined` because Clerk does not expose `publicMetadata` at that path in server-side session claims by default

1.3 WHEN the SSR role check returns `undefined` (not equal to `'admin'`) THEN the system throws a redirect to `/`, denying access to a legitimately authenticated admin user

### Expected Behavior (Correct)

2.1 WHEN an authenticated admin user performs a full-page refresh on any `/admin/*` route THEN the system SHALL correctly resolve the user's admin role from session claims and allow them to remain on the page

2.2 WHEN the SSR `beforeLoad` guard reads the admin role from session claims THEN the system SHALL access the role using the correct claims path where Clerk exposes `publicMetadata` (e.g. `sessionClaims.public_metadata?.role` or a custom claims template key)

2.3 WHEN the SSR role check finds the admin role equals `'admin'` THEN the system SHALL allow the request to proceed without redirecting

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user who is not authenticated performs a full-page refresh on any `/admin/*` route THEN the system SHALL CONTINUE TO redirect them to `/`

3.2 WHEN an authenticated user whose role is not `'admin'` navigates to any `/admin/*` route THEN the system SHALL CONTINUE TO redirect them to `/`

3.3 WHEN `ENABLE_AUTH` is `false` THEN the system SHALL CONTINUE TO redirect all users from `/admin/*` routes to `/`

3.4 WHEN an authenticated admin user navigates to `/admin/*` via client-side navigation (without full-page refresh) THEN the system SHALL CONTINUE TO allow access without interruption

3.5 WHEN an authenticated admin user is on an `/admin/*` page and the component-level `useUser()` check runs THEN the system SHALL CONTINUE TO verify the role via `user.publicMetadata.role` and redirect non-admins
