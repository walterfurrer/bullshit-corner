# Tasks

## Task 1: Add `listMine` query to Convex submissions module

### Description
Add a new exported `query` function to `convex/submissions.ts` that returns the authenticated user's submissions, ordered newest-first, bounded to 50 results.

### Files to modify
- `convex/submissions.ts` — add `query` import from `./_generated/server`, add `listMine` export

### Requirements addressed
- Requirement 7 (Convex query for user submissions)

### Acceptance criteria
- [x] `listMine` is exported as a `query` with empty `args: {}`
- [x] Derives identity via `ctx.auth.getUserIdentity()`
- [x] Returns `[]` when user is not authenticated (does not throw)
- [x] Looks up the user document by `tokenIdentifier` using the `by_tokenIdentifier` index
- [x] Returns `[]` when no user document exists
- [x] Queries `submissions` table using `by_userId` index filtered to the user's `_id`
- [x] Orders results descending (newest first)
- [x] Bounds results with `.take(50)`

### Commit message
```
feat(convex): add listMine query for user submissions
```

---

## Task 2: Create `submission-card.tsx` component

### Description
Create a presentational card component that renders a single submission's data (topic, evidence, alias).

### Files to create
- `src/components/submission-card.tsx`

### Requirements addressed
- Requirement 3 (Fetch and display user submissions — card UI)

### Acceptance criteria
- [x] Exports a `SubmissionCard` component
- [x] Accepts props: `topic` (string, required), `evidence` (string, optional), `submittedBy` (string, optional), `submittedAt` (number, required)
- [x] Renders topic as the card heading/title
- [x] Conditionally renders evidence text when present
- [x] Conditionally renders alias when present
- [x] Uses Tailwind v4 utility classes with logical CSS (`ms-*`, `ps-*`, `text-start`)
- [x] Uses semantic HTML (e.g. `<article>`) for accessibility
- [x] Does NOT include any edit or delete controls (Requirement 4)

### Commit message
```
feat(ui): add SubmissionCard component
```

---

## Task 3: Create `/your-submissions` route page

### Description
Create the auth-gated route that displays the user's submissions as cards, with loading, auth-gate, empty, and populated states.

### Files to create
- `src/routes/your-submissions.tsx`

### Requirements addressed
- Requirement 1 (Auth-gated route access)
- Requirement 3 (Fetch and display user submissions)
- Requirement 4 (Read-only view)
- Requirement 5 (Link to Nominate page)

### Acceptance criteria
- [x] File creates route at `/your-submissions` via `createFileRoute`
- [x] Uses `useConvexAuth()` to determine auth state
- [x] Shows a loading skeleton/indicator while auth state is loading
- [x] When unauthenticated: displays "You must be logged in to see this page" message with a link back to home (`/`)
- [x] Auth-gate message uses `role="status"` and `aria-live="polite"`
- [x] When authenticated: fetches submissions via `useSuspenseQuery(convexQuery(api.submissions.listMine, {}))`
- [x] Renders a `SubmissionCard` for each submission
- [x] Displays an empty-state message when the user has zero submissions
- [x] Includes a link/button to navigate to `/nominate`
- [x] Uses SiteHeader and SiteFooter, max-w-4xl layout (consistent with other pages)
- [x] Does NOT include any edit or delete controls

### Commit message
```
feat(routes): add auth-gated Your Submissions page
```

---

## Task 4: Build custom user menu dropdown and replace Clerk's UserButton

### Description
Install shadcn's dropdown-menu component, create a custom `UserMenu` component that provides navigation to submissions, account management, and sign-out, then replace Clerk's `<UserButton>` in the site header.

### Files to create
- `src/components/ui/dropdown-menu.tsx` (via `pnpm dlx shadcn@latest add dropdown-menu`)
- `src/components/user-menu.tsx`

### Files to modify
- `src/components/site-header.tsx` — replace `<UserButton />` with `<UserMenu />`

### Requirements addressed
- Requirement 2 (Custom user menu dropdown)

### Acceptance criteria
- [x] shadcn dropdown-menu component is installed (`src/components/ui/dropdown-menu.tsx` exists)
- [x] `UserMenu` component is exported from `src/components/user-menu.tsx`
- [x] `UserMenu` uses `useUser()` to display the user's avatar as the trigger button
- [x] `UserMenu` renders a "Your Submissions" item that navigates to `/your-submissions`
- [x] `UserMenu` renders a "Manage Account" item that calls `openUserProfile()`
- [x] `UserMenu` renders a "Sign Out" item that calls `signOut()`
- [x] Items are separated with a `DropdownMenuSeparator` before "Sign Out"
- [x] `site-header.tsx` no longer imports or renders `<UserButton>` from Clerk
- [x] `site-header.tsx` renders `<UserMenu />` in the desktop nav (inside `<Show when="signed-in">`)
- [x] `site-header.tsx` renders `<UserMenu />` in the mobile nav (inside `<Show when="signed-in">`)
- [x] `UserMenu` returns `null` when `user` is null (safety guard)
- [x] Dropdown uses Phosphor icons consistent with the rest of the app
- [x] Trigger button has `aria-label="User menu"` for accessibility

### Commit message
```
feat(nav): replace Clerk UserButton with custom user menu dropdown
```

---

## Task 5: Add cross-link from Nominate page to Your Submissions

### Description
On the `/nominate` page, add a conditional link visible only to signed-in users that navigates to `/your-submissions`.

### Files to modify
- `src/routes/nominate.tsx`

### Requirements addressed
- Requirement 6 (Cross-link from Nominate page)

### Acceptance criteria
- [x] A link with text like "View your submissions here" is added to the Nominate page
- [x] Link is conditionally rendered only for signed-in users (using Clerk `<Show when="signed-in">`)
- [x] Link navigates to `/your-submissions`
- [x] Link is hidden when `ENABLE_AUTH` is false (gated by feature flag for consistency)
- [x] Positioned after the form and before `<SiteFooter />`

### Commit message
```
feat(nominate): add cross-link to Your Submissions for signed-in users
```
