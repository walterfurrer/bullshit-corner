# Implementation Plan: Role-Based Access Control

## Overview

Implement RBAC for Bullshit Corner by propagating Clerk role metadata to Convex via JWT custom claims, enforcing access at the route layer (TanStack Router `beforeLoad`) and data layer (Convex `requireAdmin()` helper), and building an admin panel with leaderboard management and submission review.

## Tasks

- [x] 1. Clerk session token configuration and Convex auth helper
  - [x] 1.1 Document the Clerk Dashboard session token customization
    - Add a `metadata` custom claim (`"metadata": "{{user.public_metadata}}"`) in Clerk Dashboard → Sessions → Customize session token
    - This is a manual dashboard step — create a comment/doc in `convex/lib/auth.ts` referencing the required Clerk config
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Create the Convex auth helper at `convex/lib/auth.ts`
    - Implement `requireAdmin(ctx)` — retrieves identity, throws `ConvexError({ code: "UNAUTHENTICATED" })` if no identity, throws `ConvexError({ code: "FORBIDDEN" })` if role !== "admin"
    - Implement `getUserRole(ctx)` — returns role string or `null` (no throw)
    - Identity role read from `(identity as any).metadata?.role`
    - Treat absent/undefined/unrecognised role values as `"general_user"`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 1.3 Write property tests for `requireAdmin()` using fast-check
    - **Property 1: Unauthenticated callers cannot execute admin functions**
    - **Property 2: Non-admin authenticated callers cannot execute admin functions**
    - **Property 3: Admin callers pass the guard and execute the function body**
    - **Validates: Requirements 3.1, 3.2, 3.3, 1.3, 1.4, 1.5**

- [x] 2. Schema changes and submission review backend
  - [x] 2.1 Update `convex/schema.ts` — add `chosenAt`, `chosenBy`, `isChosen` fields to `submissions` table
    - Add `chosenAt: v.optional(v.number())`
    - Add `chosenBy: v.optional(v.id('users'))`
    - Add `isChosen: v.optional(v.boolean())`
    - Add index `by_isChosen_and_submittedAt` on `['isChosen', 'submittedAt']`
    - _Requirements: 5.2, 5.4, 5.6_

  - [x] 2.2 Create `convex/admin/submissions.ts` — admin submission review functions
    - `list` query: paginated unchosen submissions (isChosen !== true), ordered desc by submittedAt, max 50 per page
    - `listChosen` query: paginated chosen submissions, ordered desc by submittedAt
    - `markChosen` mutation: set `chosenAt`, `chosenBy`, `isChosen: true`; idempotent if already chosen
    - `unmarkChosen` mutation: clear `chosenAt`, `chosenBy`, set `isChosen: false`
    - All functions call `requireAdmin(ctx)` first
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 3.1_

  - [x] 2.3 Write property tests for submission chosen/unchosen logic
    - **Property 6: Marking a submission as chosen excludes it from default view**
    - **Property 7: Unmarking a chosen submission returns it to the pool**
    - **Validates: Requirements 5.2, 5.4, 5.6**

- [x] 3. Admin leaderboard management backend
  - [x] 3.1 Create `convex/admin/topics.ts` — admin leaderboard CRUD functions
    - `list` query: all topics ordered by ranking (for admin editing view)
    - `create` mutation: validate title (non-empty, ≤200 chars), insert topic at given ranking, shift existing topics
    - `update` mutation: validate title if provided, patch specified fields only
    - `reorder` mutation: move topic from position A to B, re-rank all affected topics to maintain contiguous sequence
    - `remove` mutation: delete topic, close ranking gap by shifting subsequent topics
    - All functions call `requireAdmin(ctx)` first
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 3.1_

  - [x] 3.2 Write property tests for reorder and remove logic
    - **Property 4: Reorder preserves contiguous ranking with no gaps or duplicates**
    - **Property 5: Remove closes ranking gaps**
    - **Validates: Requirements 4.3, 4.4**

  - [x] 3.3 Write property test for title validation
    - **Property 8: Title validation rejects empty and oversized titles**
    - **Validates: Requirements 4.6**

- [x] 4. Checkpoint — Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Client-side route protection and admin layout
  - [x] 5.1 Create the admin layout route at `src/routes/_app/admin.tsx`
    - `beforeLoad` hook: on SSR use `@clerk/tanstack-react-start/server` `auth()` to check userId and sessionClaims metadata.role
    - Redirect to `/sign-in` if unauthenticated, redirect to `/` if not admin
    - CSR fallback: use Clerk hooks in the component to verify role and redirect
    - Render admin navigation + `<Outlet />`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 5.2 Conditionally render admin nav link in site header
    - In `src/components/site-header.tsx`, show "Admin" link only when user's session claims include role === "admin"
    - Use Clerk's `useSession()` or `useUser()` to read `publicMetadata.role`
    - _Requirements: 6.3_

- [x] 6. Admin panel pages
  - [x] 6.1 Create `src/routes/_app/admin/index.tsx` — admin dashboard redirect
    - Redirect to the leaderboard page (`/admin/leaderboard`) on load
    - _Requirements: 4.5_

  - [x] 6.2 Create `src/routes/_app/admin/leaderboard.tsx` — leaderboard management page
    - Display all topics with ranking, title, description, submittedBy, youtubeUrl
    - Inline or modal-based editing (create/edit/remove)
    - Drag-to-reorder or move-up/move-down buttons for reordering
    - Title validation: reject empty or >200 chars with error message before calling mutation
    - Wire to `convex/admin/topics` functions via TanStack Query + convexQuery
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 6.3 Create `src/routes/_app/admin/submissions.tsx` — submission review page
    - Tab/filter toggle: "Available" (unchosen) vs "Chosen"
    - Display submission topic (truncated at 200 chars with ellipsis), details, submitter alias, submission date
    - "Choose" action on unchosen submissions → calls `markChosen`
    - "Undo" action on chosen submissions → calls `unmarkChosen`
    - Paginated at 50 entries per page
    - Real-time updates via Convex reactivity (no manual refresh needed)
    - Show error toast if markChosen fails
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 7. Admin UI components
  - [x] 7.1 Create `src/components/admin/admin-nav.tsx`
    - Tab-style navigation between Leaderboard and Submissions sections
    - Highlight active tab based on current route
    - _Requirements: 4.5, 5.1_

  - [x] 7.2 Create `src/components/admin/topic-form.tsx`
    - Shared form for create/edit topic
    - Fields: title (required, max 200), description (optional), youtubeUrl (optional), submittedBy (optional)
    - Client-side validation with error display
    - _Requirements: 4.1, 4.2, 4.6_

  - [x] 7.3 Create `src/components/admin/topic-list-item.tsx`
    - Displays topic in a list row with ranking, title, truncated description
    - Action buttons: edit, remove, reorder controls
    - _Requirements: 4.3, 4.4, 4.5_

  - [x] 7.4 Create `src/components/admin/submission-card.tsx`
    - Displays submission entry: topic text (truncated at 200 chars), details, alias, date
    - "Choose" / "Undo choose" action button depending on current filter
    - _Requirements: 5.2, 5.5, 5.6_

  - [x] 7.5 Create `src/components/admin/submission-filters.tsx`
    - Tab toggle component: "Available" / "Chosen" filter
    - Controls which query is displayed in the parent page
    - _Requirements: 5.4_

- [x] 8. Checkpoint — Full admin panel wired
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. General user and role propagation verification
  - [x] 9.1 Verify existing public routes remain unguarded
    - Confirm the homepage (leaderboard view) at `/_app/index.tsx` does NOT require authentication
    - Confirm submission route still works for authenticated general users
    - No changes needed if existing routes already lack auth guards — just verify
    - _Requirements: 6.1, 6.2_

  - [x] 9.2 Ensure general user redirect for direct admin URL access
    - Verify that the layout route guard handles the redirect for general users and unauthenticated visitors navigating directly to `/admin/*`
    - Covered by task 5.1 — this is a verification step
    - _Requirements: 6.4, 2.1, 2.2_

  - [x] 9.3 Write unit tests for route guard behaviour and role propagation
    - Test: unauthenticated → redirect to /sign-in
    - Test: authenticated non-admin → redirect to /
    - Test: admin → render admin outlet
    - Test: role change (removed admin) → redirect on next navigation
    - _Requirements: 2.1, 2.2, 2.3, 7.1, 7.2_

- [x] 10. Final checkpoint — All features complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design doc
- The Clerk Dashboard session token customization (task 1.1) is a manual step — the code will reference it via comments but can't automate the dashboard change
- Existing `convex/topics.ts` uses `internalMutation` — the new `convex/admin/topics.ts` will use regular `mutation` exposed to the client, gated by `requireAdmin()`
- Per Requirement 7.3, no role column is added to the `users` table — the JWT claim is authoritative
- Import alias convention: use `#/*` throughout (not `@/*`)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1"] },
    { "id": 1, "tasks": ["1.3", "2.2", "3.1"] },
    { "id": 2, "tasks": ["2.3", "3.2", "3.3"] },
    { "id": 3, "tasks": ["5.1", "5.2"] },
    { "id": 4, "tasks": ["6.1", "7.1", "7.2", "7.3", "7.4", "7.5"] },
    { "id": 5, "tasks": ["6.2", "6.3"] },
    { "id": 6, "tasks": ["9.1", "9.2"] },
    { "id": 7, "tasks": ["9.3"] }
  ]
}
```
