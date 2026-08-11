# Implementation Plan: User Name Onboarding & Anonymous Submission Settings

## Overview

Add `alwaysAnonymous` to the users table, create an onboarding flow for new sign-ups, a settings page for returning users, and wire the submission form to auto-populate/lock the alias field based on user preferences. All new UI is gated behind `ENABLE_AUTH`.

## Tasks

- [x] 1. Schema extension & backend mutations
  - [x] 1.1 Add `alwaysAnonymous` field to schema and modify `users.sync`
    - Add `alwaysAnonymous: v.boolean()` to the `users` table in `convex/schema.ts`
    - In `convex/users.ts`, modify `getOrCreateUserId`:
      - On **insert** (new user): include `alwaysAnonymous: false` in the document
      - On **patch** (existing user): exclude `alwaysAnonymous` from the patch object so it is never overwritten by sync
    - Update `profileFromIdentity` or the insert/patch logic to ensure the field is set on creation and preserved on update
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Create `convex/constants.ts` and `users.updateProfile` mutation
    - Create `convex/constants.ts` exporting `DISPLAY_NAME_MAX_LENGTH = 50`
    - Add a new `updateProfile` mutation in `convex/users.ts` with args `{ name: v.optional(v.string()), alwaysAnonymous: v.optional(v.boolean()) }`
    - Authenticate the caller, look up the user by `tokenIdentifier`
    - Validate: reject empty/whitespace-only name when `alwaysAnonymous` is not being set to `true`
    - Validate: reject names whose trimmed length exceeds `DISPLAY_NAME_MAX_LENGTH` (50 chars) — import from `./constants`
    - Patch the user document with trimmed name and/or the new `alwaysAnonymous` value, plus `updatedAt: Date.now()`
    - _Requirements: 3.3, 3.4, 3.5, 4.2, 4.3, 9.3, 9.5, 10.3, 10.5, 12.1, 12.2_

  - [x] 1.3 Modify `submissions.submit` to enforce anonymity
    - After resolving `userId` in `convex/submissions.ts`, read the user document via `ctx.db.get(userId)`
    - If `user.alwaysAnonymous === true`, override `submittedBy` to `"Anonymous"` regardless of client input
    - Otherwise, keep existing behavior (use client-provided `submittedBy`)
    - _Requirements: 8.1, 8.2_

  - [x] 1.4 Create backfill migration for existing users
    - Add a one-time internal mutation in `convex/users.ts` (or a separate `convex/migrations.ts`) that queries all users missing `alwaysAnonymous` and patches them with `alwaysAnonymous: false`
    - This ensures the schema validator passes for existing documents
    - _Requirements: 1.1_

  - [x] 1.5 Write property tests for sync and updateProfile
    - **Property 1: New user sync initializes alwaysAnonymous to false**
    - **Validates: Requirements 1.2**
    - **Property 2: Sync preserves alwaysAnonymous on existing users**
    - **Validates: Requirements 1.3**
    - **Property 4: updateProfile round-trip preserves values**
    - **Validates: Requirements 3.3, 3.4, 4.2, 9.3, 10.3, 10.5**
    - **Property 5: updateProfile rejects empty name unless anonymous**
    - **Validates: Requirements 3.5, 9.5**
    - **Property 8: updateProfile rejects names exceeding 50 characters**
    - **Validates: Requirements 12.1, 12.2**

  - [x] 1.6 Write property test for backend anonymity enforcement
    - **Property 7: Backend anonymity enforcement on submission**
    - **Validates: Requirements 8.1, 8.2**

- [x] 2. Checkpoint — Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Client hooks and utilities
  - [x] 3.1 Create `useCurrentUser` hook
    - Create `src/hooks/use-current-user.ts`
    - Wrap `useQuery(api.users.getMe)` and expose: `user` (full document or `null`), `needsOnboarding` (boolean: `!user.name && !user.alwaysAnonymous`), `isLoading`
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Write property test for needsOnboarding derivation
    - **Property 3: Needs-onboarding derivation**
    - **Validates: Requirements 2.1, 2.2**

- [x] 4. Onboarding route and guard
  - [x] 4.1 Create `/onboarding` route (`src/routes/onboarding.tsx`)
    - Route guard: if `!ENABLE_AUTH`, redirect to `/`; if user already has `name` set or `alwaysAnonymous === true`, redirect to `/`
    - UI: centered card with heading "Welcome to Bullshit Corner", text input for display name, "Save Name" primary button, "Stay Anonymous" secondary button
    - On "Save Name": call `users.updateProfile({ name, alwaysAnonymous: false })`, show validation error if name is empty
    - Client-side max-length validation: if trimmed name exceeds 50 characters, show inline error "Display name must be 50 characters or fewer." and prevent submission
    - On "Stay Anonymous": call `users.updateProfile({ alwaysAnonymous: true })`
    - After either action succeeds: show confirmation message + "Continue to Home" link
    - Use shadcn Card, Input, Button, Label components
    - _Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 5.1, 5.2, 13.1_

  - [x] 4.2 Create `OnboardingGuard` component and add to `__root.tsx`
    - Create a component (can be inline in `__root.tsx` or a separate file) that:
      - Checks `ENABLE_AUTH` — if false, renders nothing
      - Uses `useCurrentUser()` — if `needsOnboarding === true` and current path is not `/onboarding`, navigates to `/onboarding`
      - Only fires after user document has loaded (not during loading state)
    - Render `<OnboardingGuard />` inside `RootDocument` after `<SyncUser />`
    - _Requirements: 2.1, 2.2, 2.3, 13.1_

- [x] 5. Settings route
  - [x] 5.1 Install required shadcn components (Switch, Tooltip)
    - Run `pnpm dlx shadcn@latest add switch tooltip` to add these components if not already present
    - _Requirements: 7.3, 10.1_

  - [x] 5.2 Create `/settings` route (`src/routes/settings.tsx`)
    - Route guard: if `!ENABLE_AUTH` or not authenticated, redirect to `/`
    - UI sections:
      - "Display Name": text input pre-filled with current `user.name`, "Save" button; validation error if empty while `alwaysAnonymous` is false; client-side max-length validation: show inline error if trimmed name exceeds 50 characters; success confirmation on save
      - "Privacy": shadcn Switch labeled "Always submit anonymously" reflecting `user.alwaysAnonymous`; toggling on calls `updateProfile({ alwaysAnonymous: true })`; toggling off with empty name shows inline prompt to enter a name first; toggling off with non-empty name calls `updateProfile({ alwaysAnonymous: false })`
    - Uses `useCurrentUser` hook and `useMutation(api.users.updateProfile)`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 10.1, 10.2, 10.3, 10.4, 10.5, 13.2_

- [x] 6. Submission form integration
  - [x] 6.1 Modify `submission-form.tsx` to auto-populate and lock alias
    - Import `useCurrentUser` hook
    - When `ENABLE_AUTH` is `true` and user is authenticated:
      - If `user.alwaysAnonymous === true`: set alias field value to `"Anonymous"`, disable the input, wrap in shadcn `Tooltip` ("Change this in Settings to use a display name."), ensure tooltip is keyboard-accessible
      - Else if `user.name` is non-empty: set alias field `defaultValues.alias` to `user.name` (still editable)
      - Else: leave empty (existing placeholder behavior)
    - When `ENABLE_AUTH` is `false`: no changes to current behavior
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 13.3_

  - [x] 6.2 Write property test for alias field derivation
    - **Property 6: Submission alias field derivation**
    - **Validates: Requirements 6.1, 6.2, 7.1, 7.2**

- [x] 7. Navigation: Settings link in user menu
  - [x] 7.1 Add "Settings" link to user menu
    - In `src/components/user-menu.tsx`, add a `DropdownMenuItem` with a gear icon and "Settings" text, linking to `/settings`
    - Place it between "Your Submissions" and "Manage Account"
    - Use an icon from `@phosphor-icons/react` (e.g. `GearSixIcon`) consistent with existing menu icons
    - _Requirements: 11.1, 11.2_

- [x] 8. Checkpoint — Feature complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The backfill migration (1.4) should be run once against the dev deployment before testing and once against prod on deploy
- shadcn components use the `#/*` import alias per project convention
- All new UI uses Tailwind CSS v4 utilities (see AGENTS.md for v4 naming changes) and logical CSS properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1", "5.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "3.2"] },
    { "id": 2, "tasks": ["1.5", "1.6", "4.1", "4.2"] },
    { "id": 3, "tasks": ["5.2", "6.1", "7.1"] },
    { "id": 4, "tasks": ["6.2"] }
  ]
}
```
