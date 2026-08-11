# Design Document

## Overview

Add a protected `/your-submissions` route that displays the current user's past nominations as cards. The feature spans four layers: a Convex query function, a new route file, a submission card component, and modifications to existing navigation and nominate-page components.

## Architecture

### Data Flow

```
Clerk (auth) → ConvexProviderWithClerk → ctx.auth.getUserIdentity()
                                              ↓
                               convex/submissions.ts → listMine query
                                              ↓
                              uses `by_userId` index → returns Doc<"submissions">[]
                                              ↓
                         @convex-dev/react-query (convexQuery) → useSuspenseQuery
                                              ↓
                              /your-submissions route → SubmissionCard[]
```

### New Files

| File | Purpose |
|------|---------|
| `convex/submissions.ts` (add `listMine` export) | Convex query that returns the authenticated user's submissions |
| `src/routes/your-submissions.tsx` | Auth-gated route page component |
| `src/components/submission-card.tsx` | Presentational card for a single submission |
| `src/components/user-menu.tsx` | Custom dropdown menu replacing Clerk's UserButton |
| `src/components/ui/dropdown-menu.tsx` | shadcn dropdown-menu primitive (installed via CLI) |

### Modified Files

| File | Change |
|------|--------|
| `src/components/site-header.tsx` | Replace `<UserButton />` with custom `<UserMenu />` component |
| `src/routes/nominate.tsx` | Add conditional cross-link to `/your-submissions` for signed-in users |

## Detailed Design

### 1. Convex Query — `submissions.listMine`

Add a new exported `query` to the existing `convex/submissions.ts`:

```typescript
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_tokenIdentifier', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier),
      )
      .unique()

    if (!user) {
      return []
    }

    return ctx.db
      .query('submissions')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(50)
  },
})
```

Key decisions:
- No user-identifier argument — derived server-side per Convex auth guidelines.
- Returns empty array (not throws) for unauthenticated callers, so the client can still call it without error during auth transitions.
- Uses `by_userId` index for efficient filtering.
- Results are ordered descending (newest first) via the built-in `_creationTime` tiebreak within the index, but since `by_userId` only indexes `userId`, we rely on `.order('desc')` which orders by `_creationTime` descending within the userId match. For explicit newest-first by `submittedAt`, we order by `_creationTime` desc (which mirrors `submittedAt` insertion order).
- Bounded to 50 results.

### 2. Route — `src/routes/your-submissions.tsx`

A file-based route at `/your-submissions`. Uses `useConvexAuth()` from `convex/react` to determine auth state:

- **Loading state**: Show skeleton/loading indicator while `isLoading` is true.
- **Unauthenticated state**: Display "You must be logged in to see this page" message with a link/redirect back to `/`.
- **Authenticated state**: Fetch and display submission cards via `useSuspenseQuery(convexQuery(api.submissions.listMine, {}))`.

Page layout follows the existing pattern (SiteHeader, main with max-w-4xl, SiteFooter).

```tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useConvexAuth } from 'convex/react'

import { SubmissionCard } from '#/components/submission-card.tsx'
import { SiteFooter } from '#/components/site-footer.tsx'
import { SiteHeader } from '#/components/site-header.tsx'
import { Button } from '#/components/ui/button.tsx'

import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/your-submissions')({
  component: YourSubmissionsPage,
})

function YourSubmissionsPage() {
  const { isAuthenticated, isLoading } = useConvexAuth()

  if (isLoading) {
    return <YourSubmissionsShell><LoadingSkeleton /></YourSubmissionsShell>
  }

  if (!isAuthenticated) {
    return <YourSubmissionsShell><AuthGate /></YourSubmissionsShell>
  }

  return <YourSubmissionsShell><SubmissionsList /></YourSubmissionsShell>
}
```

The `AuthGate` component displays the message and a "Go to Home" link (or uses `useNavigate` with a timeout for auto-redirect).

The `SubmissionsList` component calls `useSuspenseQuery` and maps over results, rendering `SubmissionCard` for each. When the array is empty, it shows an empty-state message with a CTA to nominate.

### 3. Component — `src/components/submission-card.tsx`

A presentational component accepting a submission document:

```tsx
type SubmissionCardProps = {
  topic: string
  evidence?: string
  submittedBy?: string
  submittedAt: number
}
```

Renders as a bordered card (using Tailwind utility classes, not shadcn `<Card>` unless already in the project — keeping it lightweight). Shows:
- **Topic** as the card heading/title (prominent)
- **Evidence** as body text (if present)
- **Alias** as secondary metadata (if present)
- Optionally a relative timestamp (e.g. "3 days ago") for `submittedAt`

### 4. Custom User Menu — `src/components/user-menu.tsx`

Replace Clerk's `<UserButton>` with a custom dropdown menu built on shadcn's dropdown-menu component (Radix primitive, already installed as `radix-ui@^1.6.7`).

**New File:** `src/components/user-menu.tsx`

**Dependencies to add:** Install shadcn dropdown-menu via `pnpm dlx shadcn@latest add dropdown-menu`

**Implementation:**

```tsx
import { useClerk, useUser } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { ListBullets, SignOut, UserCircle } from '@phosphor-icons/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx'
import { Button } from '#/components/ui/button.tsx'

export function UserMenu() {
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label="User menu">
          <img
            src={user.imageUrl}
            alt=""
            className="size-8 rounded-full"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link to="/your-submissions">
            <ListBullets className="me-2 size-4" aria-hidden="true" />
            Your Submissions
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openUserProfile()}>
          <UserCircle className="me-2 size-4" aria-hidden="true" />
          Manage Account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <SignOut className="me-2 size-4" aria-hidden="true" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Modified File:** `src/components/site-header.tsx`
- Remove `UserButton` import from `@clerk/tanstack-react-start`
- Import `UserMenu` from `#/components/user-menu.tsx`
- Replace both instances of `<UserButton />` (desktop and mobile) with `<UserMenu />`

### 5. Cross-link in `nominate.tsx`

At the bottom of the Nominate page (before `<SiteFooter />`), add a conditional block:

```tsx
<Show when="signed-in">
  <p className="text-sm text-muted-foreground">
    <Link to="/your-submissions" className="...">
      View your submissions here
    </Link>
  </p>
</Show>
```

Uses Clerk's `<Show>` component (already available from `@clerk/tanstack-react-start`) and gated by the `ENABLE_AUTH` feature flag for consistency.

## Accessibility Considerations

- Submission cards use semantic HTML (`<article>` or heading hierarchy) for screen reader navigation.
- Auth-gate message uses `role="status"` with `aria-live="polite"`.
- Loading states use proper `aria-busy` attributes.
- All interactive elements (links, buttons) have accessible labels.
- Logical CSS (`ms-*`, `ps-*`, `text-start`) per house style.

## Performance Considerations

- The `listMine` query uses an indexed scan — O(n) in the user's submissions only, not a full table scan.
- Bounded to 50 results; pagination can be added later if needed.
- `useSuspenseQuery` with `convexQuery` provides real-time reactivity — if the user submits a new topic in another tab, the list updates automatically.

## Security Considerations

- User identity is derived server-side from `ctx.auth.getUserIdentity()` — no user ID passed from client.
- The query returns only the authenticated user's own data.
- Unauthenticated callers get an empty array, not an error, preventing information leakage about the endpoint's existence.

## Commit Strategy

The user requested small, atomic commits. The tasks phase will break this into:

1. Add `listMine` query to Convex backend
2. Create `submission-card.tsx` component
3. Create `/your-submissions` route page
4. Install shadcn dropdown-menu, create custom `UserMenu` component, replace `<UserButton>` in site-header
5. Add cross-link from nominate page
