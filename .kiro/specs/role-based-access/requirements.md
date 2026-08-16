# Requirements Document

## Introduction

Role-Based Access Control (RBAC) for Bullshit Corner. The system distinguishes between two user roles — General User and Admin — to gate access to features and routes. General Users can view the leaderboard and submit topics. Admins can additionally manage the leaderboard (add/edit/remove/reorder topics) and review user-submitted topics via a protected admin interface. Roles are sourced from Clerk metadata and enforced both at the route level (TanStack Router) and the data layer (Convex server functions).

## Glossary

- **RBAC_System**: The combination of Clerk role metadata, Convex authorization checks, and TanStack Router route guards that together enforce role-based access.
- **General_User**: An authenticated user with no special role assignment; the default role for all signed-up users.
- **Admin**: An authenticated user whose Clerk `publicMetadata.role` is set to `"admin"`.
- **Role**: A string value stored in Clerk `publicMetadata.role` that determines a user's permission level. Valid values are `"admin"` or absent/undefined (treated as General_User).
- **Admin_Panel**: A set of protected routes under `/admin` accessible only to Admin users.
- **Submission_Pool**: The collection of user-submitted topics (the `submissions` table) that Admins can review and act upon.
- **Leaderboard**: The ranked list of topics (the `topics` table) displayed on the homepage.
- **Route_Guard**: A `beforeLoad` check on a route that verifies the current user's role and redirects unauthorized users.
- **Convex_Auth_Check**: Server-side identity and role verification performed within a Convex query or mutation handler before executing privileged logic.

## Requirements

### Requirement 1: Role Storage and Propagation

**User Story:** As a developer, I want user roles to be stored in Clerk's `publicMetadata` and propagated to Convex via JWT claims, so that both client and server can determine a user's role from a single source of truth.

#### Acceptance Criteria

1. THE RBAC_System SHALL treat Clerk `publicMetadata.role` as the authoritative source for a user's role, where the only recognised role values are `"admin"` and `"general_user"`.
2. WHEN a user's JWT is issued by Clerk, THE RBAC_System SHALL include the `role` claim from `publicMetadata` as a top-level custom claim in the token payload so that Convex functions can read it via `ctx.auth.getUserIdentity()`.
3. IF `publicMetadata.role` is absent, undefined, or null for a user, THEN THE RBAC_System SHALL treat that user as a General_User.
4. IF `publicMetadata.role` equals `"admin"`, THEN THE RBAC_System SHALL treat that user as an Admin.
5. IF `publicMetadata.role` contains a value not in the recognised set (`"admin"`, `"general_user"`), THEN THE RBAC_System SHALL treat that user as a General_User.

### Requirement 2: Client-Side Route Protection

**User Story:** As an admin, I want admin routes to be protected behind a role check, so that General Users cannot access admin pages.

#### Acceptance Criteria

1. WHEN an unauthenticated visitor navigates to any route under the `/admin` path prefix, THE Route_Guard SHALL redirect the visitor to the Clerk sign-in route (`/sign-in`).
2. WHEN an authenticated user whose Clerk session claims do not include the role value `admin` navigates to any route under the `/admin` path prefix, THE Route_Guard SHALL redirect the user to the homepage (`/`).
3. WHEN an authenticated user whose Clerk session claims include the role value `admin` navigates to any route under the `/admin` path prefix, THE Route_Guard SHALL allow the navigation to proceed and render the requested route.
4. THE Route_Guard SHALL perform role verification in the route's `beforeLoad` hook by reading the `role` field from the Clerk session claims available on the client and comparing it to the expected value before the route component mounts.
5. IF the Clerk session claims are unavailable or the `role` field is missing during the `beforeLoad` evaluation, THEN THE Route_Guard SHALL treat the user as unauthorized and redirect to the homepage (`/`).

### Requirement 3: Server-Side Authorization Enforcement

**User Story:** As a developer, I want all admin-only Convex mutations and queries to verify the caller's role server-side, so that privilege escalation via direct API calls is prevented.

#### Acceptance Criteria

1. WHEN a Convex mutation or query is designated as admin-only, THE Convex_Auth_Check SHALL call `ctx.auth.getUserIdentity()` to obtain the caller's identity and SHALL verify that the identity's role field equals `"admin"` before executing the function's core logic.
2. IF `ctx.auth.getUserIdentity()` returns `null` when an admin-only Convex function is invoked, THEN THE Convex_Auth_Check SHALL throw a `ConvexError` with a payload that includes an error code distinguishable as an authentication failure (e.g., code `"UNAUTHENTICATED"`), and the function SHALL NOT execute any database reads or writes beyond the identity check.
3. IF an authenticated caller whose identity does not contain the `"admin"` role invokes an admin-only Convex function, THEN THE Convex_Auth_Check SHALL throw a `ConvexError` with a payload that includes an error code distinguishable as an authorization failure (e.g., code `"FORBIDDEN"`), and the function SHALL NOT execute any database reads or writes beyond the identity check.
4. THE Convex_Auth_Check SHALL use a single shared helper function, imported by all admin-only Convex functions, to perform the identity retrieval and role verification described in criteria 1–3.
5. THE Convex_Auth_Check SHALL derive the caller's identity exclusively from `ctx.auth.getUserIdentity()` and SHALL NOT accept a user ID, role, or any identity claim as a function argument for authorization purposes.

### Requirement 4: Admin Leaderboard Management

**User Story:** As an admin, I want to add, edit, reorder, and remove topics on the leaderboard via the Admin_Panel, so that I can manage the leaderboard from a front-end interface instead of the Convex dashboard.

#### Acceptance Criteria

1. WHEN an Admin creates a new topic via the Admin_Panel, THE RBAC_System SHALL insert the topic into the Leaderboard with the specified title, ranking position, and optional description and YouTube URL.
2. WHEN an Admin edits an existing topic, THE RBAC_System SHALL update the topic's title, description, YouTube URL, or submittedBy fields as specified without altering unmodified fields.
3. WHEN an Admin reorders topics by moving a topic from position A to position B, THE RBAC_System SHALL update the ranking values of all affected topics so that the resulting sequence contains no duplicate rankings and no gaps.
4. WHEN an Admin removes a topic, THE RBAC_System SHALL delete the topic from the Leaderboard and shift the ranking of subsequent topics to close the gap.
5. THE Admin_Panel SHALL display the current Leaderboard with inline or modal-based editing capabilities, showing each topic's current ranking, title, description, submittedBy, and YouTube URL.
6. IF a create or edit operation provides a title that is empty or exceeds 200 characters, THEN THE Admin_Panel SHALL display a validation error and SHALL NOT submit the mutation.

### Requirement 5: Admin Submission Review

**User Story:** As an admin, I want to view all user-submitted topics and mark selected ones as "chosen," so that I can curate submissions and remove chosen entries from the available pool.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display entries from the Submission_Pool in reverse chronological order, paginated with a maximum of 50 entries per page.
2. WHEN an Admin marks a submission as "chosen," THE RBAC_System SHALL update the submission record with a `chosenAt` timestamp and the Admin's user ID, and remove that entry from the current page view within 2 seconds without requiring a full page reload.
3. IF the system fails to mark a submission as "chosen," THEN THE Admin_Panel SHALL display an error message indicating the operation failed and leave the submission unchanged in the list.
4. WHILE a submission has a non-null `chosenAt` value, THE RBAC_System SHALL exclude that submission from the default Submission_Pool view shown to Admins; a separate "chosen" filter SHALL allow Admins to view previously chosen submissions.
5. THE Admin_Panel SHALL display the submission's topic text (truncated with an ellipsis beyond 200 characters), optional details, submitter alias, and submission date for each entry.
6. WHEN an Admin removes the "chosen" status from a previously chosen submission via the chosen filter view, THE RBAC_System SHALL clear the `chosenAt` timestamp and return that submission to the default Submission_Pool view.

### Requirement 6: General User Permissions

**User Story:** As a general user, I want to continue viewing the leaderboard and submitting topics without interference from the RBAC system, so that my existing experience is unchanged.

#### Acceptance Criteria

1. THE RBAC_System SHALL allow unauthenticated visitors to view the Leaderboard without any role check.
2. IF a user is authenticated as a General_User, THEN THE RBAC_System SHALL allow topic submission using the existing submission flow without requiring any role beyond authenticated status.
3. THE RBAC_System SHALL NOT render Admin_Panel navigation links in the UI for General_Users or unauthenticated visitors.
4. IF a General_User or unauthenticated visitor requests an Admin_Panel route directly, THEN THE RBAC_System SHALL deny access and redirect the user to the Leaderboard page.

### Requirement 7: Role Change Propagation

**User Story:** As a developer, I want role changes made in Clerk's dashboard to take effect without requiring a code deploy, so that admin access can be granted or revoked operationally.

#### Acceptance Criteria

1. WHEN an operator updates a user's `publicMetadata.role` in the Clerk dashboard, THE RBAC_System SHALL reflect the new role on the user's next session token refresh (no app redeploy required).
2. IF an Admin's role is revoked (set to undefined or removed), THEN THE Route_Guard SHALL redirect the former Admin away from Admin_Panel routes on the next navigation or page load that triggers token evaluation.
3. THE RBAC_System SHALL NOT cache roles in Convex's `users` table as a source of truth — the JWT claim from Clerk remains authoritative for every request.
