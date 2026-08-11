# Design Document — User Name Onboarding & Anonymous Submission Settings

## Architecture Overview

This feature adds three concerns to the existing system:

1. **Schema & backend enforcement** — Extend the Convex `users` table with an `alwaysAnonymous` boolean; modify the `users.sync` and `submissions.submit` mutations to respect it.
2. **Onboarding flow** — A new `/onboarding` route that intercepts new sign-ups (users without a `name` and `alwaysAnonymous === false`) and lets them choose a display name or opt into permanent anonymity.
3. **Settings page** — A new `/settings` route for returning users to update their display name or toggle the anonymity preference.
4. **Submission form integration** — The existing submission form auto-populates or locks the alias field based on the user's profile.

All new UI is gated behind the existing `ENABLE_AUTH` feature flag. When the flag is `false`, the new routes redirect to home and the submission form maintains its current unauthenticated behavior.

---

## Data Model

### Users Table (Convex schema change)

```typescript
// convex/schema.ts
users: defineTable({
  tokenIdentifier: v.string(),
  clerkId: v.string(),
  email: v.optional(v.string()),
  name: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  alwaysAnonymous: v.boolean(),   // NEW — defaults to false on creation
  updatedAt: v.number(),
}).index('by_tokenIdentifier', ['tokenIdentifier']),
```

The `alwaysAnonymous` field is non-optional (`v.boolean()`). Existing records without the field will need a migration (Convex supports this via a one-time backfill mutation that patches all documents missing the field to `false`).

### Derived State: "Needs Onboarding"

A user needs onboarding when:
```
user.name is undefined/empty AND user.alwaysAnonymous === false
```

This is computed client-side from the user document returned by `users.getMe`.

---

## Shared Constants

### `convex/constants.ts`

A shared constants file within the `convex/` directory, importable by all Convex functions:

```typescript
// convex/constants.ts
/** Maximum allowed character count for a display name after trimming. */
export const DISPLAY_NAME_MAX_LENGTH = 50
```

Client-side code (`src/`) cannot import from `convex/` directly (different runtime), so the client duplicates this value in a local constant or uses a hardcoded `50` for input validation. Both onboarding and settings pages enforce the same limit client-side before calling the mutation; the server remains the authoritative enforcement point.

---

## Components & Interfaces

### New Convex Mutations

#### `users.updateProfile`

```typescript
// convex/users.ts
import { DISPLAY_NAME_MAX_LENGTH } from './constants'

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    alwaysAnonymous: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError('Authentication required.')

    const user = await ctx.db
      .query('users')
      .withIndex('by_tokenIdentifier', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier),
      )
      .unique()

    if (!user) throw new ConvexError('User not found.')

    const patch: Record<string, unknown> = { updatedAt: Date.now() }

    if (args.name !== undefined) {
      const trimmed = args.name.trim()
      if (trimmed.length === 0 && args.alwaysAnonymous !== true) {
        throw new ConvexError('Display name cannot be empty unless you choose to stay anonymous.')
      }
      if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
        throw new ConvexError(
          `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`
        )
      }
      patch.name = trimmed.length > 0 ? trimmed : undefined
    }

    if (args.alwaysAnonymous !== undefined) {
      patch.alwaysAnonymous = args.alwaysAnonymous
    }

    await ctx.db.patch(user._id, patch)
    return user._id
  },
})
```

#### Modified `users.sync` (via `getOrCreateUserId`)

The existing `profileFromIdentity` helper builds a patch object. Modification:

- On **insert** (new user): add `alwaysAnonymous: false` to the document.
- On **patch** (existing user): do NOT include `alwaysAnonymous` in the patch object — this preserves whatever value the user has set.

```typescript
// In getOrCreateUserId:
if (existing) {
  // Patch profile fields from Clerk — never overwrite alwaysAnonymous
  await ctx.db.patch(existing._id, profile)
  return existing._id
}

// New user — initialize alwaysAnonymous
return ctx.db.insert('users', { ...profile, alwaysAnonymous: false })
```

#### Modified `submissions.submit`

After resolving the user ID, look up the user document and enforce anonymity:

```typescript
const user = await ctx.db.get(userId)

// Server-side enforcement: override client value if user is always anonymous
const finalSubmittedBy = user?.alwaysAnonymous === true
  ? 'Anonymous'
  : submittedBy
```

### New React Components

#### `src/routes/onboarding.tsx`

- **Route guard**: If `!ENABLE_AUTH`, redirect to `/`. If user already has `name` set or `alwaysAnonymous === true`, redirect to `/`.
- **UI**: Single-column centered card with heading "Welcome to Bullshit Corner", a text input for display name, a "Save Name" primary button, and a secondary "Stay Anonymous" button/link below.
- **Client-side validation**: The display name input enforces a maximum of 50 characters (matching `DISPLAY_NAME_MAX_LENGTH`). If the trimmed value exceeds 50 characters, show an inline validation error ("Display name must be 50 characters or fewer.") and prevent submission.
- **Confirmation state**: After either action succeeds, show a success message and a "Continue to Home" link.
- Uses `useMutation` from `convex/react` calling `api.users.updateProfile`.

#### `src/routes/settings.tsx`

- **Route guard**: If `!ENABLE_AUTH`, redirect to `/`. If not authenticated, redirect to `/`.
- **UI**: Section with heading "Display Name" (text input + save button), and a "Privacy" section with the anonymous toggle (shadcn Switch component).
- **Client-side validation**: The display name input enforces a maximum of 50 characters (matching `DISPLAY_NAME_MAX_LENGTH`). If the trimmed value exceeds 50 characters, show an inline validation error ("Display name must be 50 characters or fewer.") and prevent the save action.
- **Validation**: If toggle is turned off and name is empty, show inline prompt to enter a name first.
- Uses `useQuery` for `api.users.getMe` and `useMutation` for `api.users.updateProfile`.

#### `src/hooks/use-current-user.ts`

A small custom hook that wraps `useQuery(api.users.getMe)` and exposes:
- `user` — the full user document (or `null`)
- `needsOnboarding` — `boolean` derived from `!user.name && !user.alwaysAnonymous`
- `isLoading` — query loading state

This centralizes the "needs onboarding" logic for use in both the redirect check and the submission form.

#### Modified `src/components/submission-form.tsx`

- Import `useCurrentUser` hook.
- When `ENABLE_AUTH` is `true` and user is authenticated:
  - If `user.alwaysAnonymous === true`: set alias field value to `"Anonymous"`, disable the input, wrap in shadcn `Tooltip` with message "Change this in Settings to use a display name."
  - Else if `user.name` is non-empty: set alias field `defaultValues.alias` to `user.name` (editable).
  - Else: leave empty (existing placeholder behavior).
- When `ENABLE_AUTH` is `false`: no changes to current behavior.

#### Modified `src/components/user-menu.tsx`

Add a "Settings" link between "Your Submissions" and "Manage Account":

```tsx
<DropdownMenuItem asChild>
  <Link to="/settings">
    <GearSixIcon className="me-2 size-4" aria-hidden="true" />
    Settings
  </Link>
</DropdownMenuItem>
```

### Onboarding Redirect Logic

The redirect is implemented as a client-side effect rather than a route `beforeLoad` guard (since `beforeLoad` runs on the server during SSR and the user document is fetched via Convex's reactive client, not via server-side data loading).

**Implementation**: A `<OnboardingGuard />` component rendered inside `__root.tsx` (after `<SyncUser />`) that:
1. Checks `ENABLE_AUTH` — if false, does nothing.
2. Reads `useCurrentUser()` — if `needsOnboarding === true` and current path is NOT `/onboarding`, navigates to `/onboarding`.
3. Only fires after the user document has loaded (not during loading state).

This avoids a flash by only redirecting after confirming the user record exists and lacks a name.

---

## Data Flow Diagrams

### New User Sign-Up Flow

```
Clerk sign-up → ClerkProvider fires auth state change
  → SyncUser calls users.sync → inserts user { alwaysAnonymous: false, name: undefined }
  → OnboardingGuard reads users.getMe → needsOnboarding = true
  → navigate('/onboarding')
  → User enters name → calls users.updateProfile({ name, alwaysAnonymous: false })
     OR clicks "Stay Anonymous" → calls users.updateProfile({ alwaysAnonymous: true })
  → Confirmation shown → user clicks "Continue" → navigate('/')
```

### Submission with Always-Anonymous User

```
Client submits { topic, submittedBy: "Anonymous" }  (or any value — doesn't matter)
  → submissions.submit handler:
     → resolves userId via getOrCreateUserId
     → reads user.alwaysAnonymous
     → alwaysAnonymous === true → finalSubmittedBy = "Anonymous" (server override)
     → inserts submission with finalSubmittedBy
```

---

## Error Handling

| Scenario | Handling |
|---|---|
| `users.updateProfile` called without auth | ConvexError("Authentication required.") |
| Empty name submitted with `alwaysAnonymous: false` | ConvexError("Display name cannot be empty...") — client also validates before sending |
| Display name exceeds 50 characters after trimming | ConvexError("Display name must be 50 characters or fewer.") — client also validates before sending |
| `users.getMe` returns null during onboarding guard | Wait / no-op until SyncUser has completed (loading state) |
| Network failure on profile save | Surface error in UI with retry affordance (standard mutation error handling) |
| User navigates to `/onboarding` but doesn't need it | Redirect to `/` (guard logic) |
| User navigates to `/settings` while unauthenticated | Redirect to `/` |

---

## Accessibility

- Onboarding page: single clear focus flow, form labels associated with inputs, validation errors announced via `role="alert"`.
- Settings page: Switch/checkbox has associated label, state changes announced to screen readers.
- Submission form tooltip on disabled field: accessible via keyboard focus (`tabIndex={0}` on the wrapper), tooltip content via `aria-describedby`.
- All new interactive elements are keyboard-navigable and meet WCAG 2.1 AA contrast requirements (inherited from shadcn/ui theme).

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 THE Users_Table SHALL include an `alwaysAnonymous` field of type `v.boolean()`.
  Thoughts: This is a schema constraint — it's verified by the Convex schema validation itself. Not a runtime property we test with PBT.
  Classification: SMOKE
  Test Strategy: Verify schema definition includes the field.

1.2 WHEN the Sync_Mutation creates a new user record, THE Sync_Mutation SHALL set `alwaysAnonymous` to `false`.
  Thoughts: This holds for ALL new users regardless of their identity details. We can generate random identity objects and verify the inserted document always has `alwaysAnonymous: false`.
  Classification: PROPERTY
  Test Strategy: Generate random UserIdentity objects, call sync, verify new document has alwaysAnonymous === false.

1.3 WHEN the Sync_Mutation updates an existing user record that lacks `alwaysAnonymous`, THE Sync_Mutation SHALL preserve the existing value without overwriting it.
  Thoughts: This holds for all existing users with any alwaysAnonymous value (true or false). We can create a user with a known alwaysAnonymous value, then call sync again, and verify the value didn't change.
  Classification: PROPERTY
  Test Strategy: Create user with random alwaysAnonymous value, call sync again with different identity fields, verify alwaysAnonymous is unchanged.

2.1 WHEN a user completes sign-up and `name` is empty/undefined, THE Onboarding_Page SHALL be displayed.
  Thoughts: This is testing redirect logic based on user state. The "needsOnboarding" derivation is testable as a property — for any user with empty name and alwaysAnonymous === false, needsOnboarding should be true.
  Classification: PROPERTY
  Test Strategy: Generate random user documents, verify needsOnboarding derivation matches expected logic.

2.2 WHEN an existing user has `name` set OR `alwaysAnonymous === true`, skip onboarding.
  Thoughts: Inverse of 2.1 — same property covers both. For any user with a non-empty name OR alwaysAnonymous === true, needsOnboarding should be false.
  Classification: PROPERTY (same property as 2.1)
  Test Strategy: Covered by the needsOnboarding property.

2.3 WHILE ENABLE_AUTH is false, no redirect to onboarding.
  Thoughts: This is a feature flag gate — a simple conditional. Example-based test.
  Classification: EXAMPLE
  Test Strategy: With flag false, verify no redirect occurs.

3.1-3.2 Onboarding page displays input and button.
  Thoughts: UI presence tests — example-based rendering checks.
  Classification: EXAMPLE
  Test Strategy: Render component, verify elements present.

3.3 WHEN user submits a display name, save to Users_Table name field.
  Thoughts: This is a round-trip property — for any valid name string, calling updateProfile then reading the user should return that name.
  Classification: PROPERTY
  Test Strategy: Generate random valid name strings, call updateProfile, read back, verify equality.

3.4 WHEN user submits a display name, set alwaysAnonymous to false.
  Thoughts: Subsumed by 3.3's test — when we verify the round-trip we can also check alwaysAnonymous.
  Classification: PROPERTY (combined with 3.3)

3.5 Empty display name shows validation error.
  Thoughts: This is the server-side validation: for any whitespace-only string, updateProfile should reject. This is a property.
  Classification: PROPERTY
  Test Strategy: Generate strings of pure whitespace, call updateProfile with alwaysAnonymous: false, verify rejection.

4.1 "Stay Anonymous" button displayed.
  Thoughts: UI presence — example.
  Classification: EXAMPLE

4.2 "Stay Anonymous" sets alwaysAnonymous to true.
  Thoughts: Covered by the updateProfile round-trip property when alwaysAnonymous: true is passed.
  Classification: PROPERTY (combined with updateProfile property)

4.3 "Stay Anonymous" leaves name unchanged.
  Thoughts: For any user with any current name value (or undefined), calling updateProfile with only alwaysAnonymous: true should not alter the name field.
  Classification: PROPERTY
  Test Strategy: Create user with random name, call updateProfile({ alwaysAnonymous: true }), verify name unchanged.

5.1-5.2 Confirmation message and continue button after onboarding.
  Thoughts: UI behavior after mutation success — example-based.
  Classification: EXAMPLE

6.1 Auto-populate Name_Alias_Input with stored name.
  Thoughts: This is a derivation: given user state, what should the field value be? Testable as a property over user documents.
  Classification: PROPERTY
  Test Strategy: Generate random user documents, verify derived alias field value matches expected logic.

6.2 Empty name leaves input empty.
  Thoughts: Same derivation property as 6.1.
  Classification: PROPERTY (same property as 6.1)

6.3 User can edit pre-populated value.
  Thoughts: UI interaction — example-based.
  Classification: EXAMPLE

7.1 alwaysAnonymous shows "Anonymous" in input.
  Thoughts: Same derivation property as 6.1 — just the alwaysAnonymous branch.
  Classification: PROPERTY (same property as 6.1)

7.2 alwaysAnonymous disables input.
  Thoughts: Same derivation — disabled state is derived from user document.
  Classification: PROPERTY (same derivation)

7.3-7.4 Tooltip on disabled input, accessible via keyboard.
  Thoughts: UI/accessibility — example-based.
  Classification: EXAMPLE

8.1 Backend enforces Anonymous when alwaysAnonymous is true.
  Thoughts: Critical security property. For ANY user with alwaysAnonymous === true and ANY client-provided submittedBy value, the stored submission should have submittedBy === "Anonymous".
  Classification: PROPERTY
  Test Strategy: Generate random submittedBy strings, submit with alwaysAnonymous user, verify stored value is always "Anonymous".

8.2 Backend uses client value when alwaysAnonymous is false.
  Thoughts: For any user with alwaysAnonymous === false and any client-provided submittedBy, the stored value should equal the client value (trimmed).
  Classification: PROPERTY
  Test Strategy: Generate random submittedBy strings, submit with non-anonymous user, verify stored value matches trimmed input.

9.1 Settings page at /settings.
  Thoughts: Routing — smoke test.
  Classification: SMOKE

9.2 Settings page pre-fills current name.
  Thoughts: Same derivation as the submission form — render component with user data, verify input value.
  Classification: EXAMPLE

9.3 Save updates name in Users_Table.
  Thoughts: Same round-trip property as 3.3.
  Classification: PROPERTY (covered by updateProfile round-trip)

9.4 Confirmation message on save.
  Thoughts: UI feedback — example.
  Classification: EXAMPLE

9.5 Empty name rejected when alwaysAnonymous is false.
  Thoughts: Same property as 3.5.
  Classification: PROPERTY (covered by validation property)

10.1-10.2 Toggle displays and reflects current value.
  Thoughts: UI rendering — example.
  Classification: EXAMPLE

10.3 Enabling toggle sets alwaysAnonymous to true.
  Thoughts: Covered by updateProfile property.
  Classification: PROPERTY (covered)

10.4 Disabling toggle with empty name prompts for name.
  Thoughts: Client-side validation — for any user with empty name, attempting to set alwaysAnonymous to false should be blocked until a name is provided. This is a conditional example.
  Classification: EXAMPLE

10.5 Disabling toggle with non-empty name sets alwaysAnonymous to false.
  Thoughts: Covered by updateProfile property.
  Classification: PROPERTY (covered)

11.1-11.2 Settings link in user menu.
  Thoughts: UI presence — example.
  Classification: EXAMPLE

12.1-12.3 Feature flag gating (Requirement 13).
  Thoughts: Conditional rendering/redirect — example-based tests with flag toggled.
  Classification: EXAMPLE

12 (Requirement 12): Server-Side Display Name Length Enforcement

12.1 WHEN the UpdateProfile_Mutation receives a `name` argument whose trimmed length exceeds DISPLAY_NAME_MAX_LENGTH, THE UpdateProfile_Mutation SHALL reject the request with an error.
  Thoughts: This holds for ALL strings longer than 50 characters after trimming. We can generate random strings with trimmed length > 50 and verify the mutation rejects them. This is a property — the input space is large (any string over 50 chars), and behavior should be consistent for all such strings.
  Classification: PROPERTY
  Test Strategy: Generate random strings whose trimmed length exceeds 50, call updateProfile, verify rejection with appropriate error message. Document is unchanged.

12.2 THE UpdateProfile_Mutation SHALL apply the length check after trimming whitespace from the provided name value.
  Thoughts: This is about the order of operations (trim then check). We can generate strings with leading/trailing whitespace that are > 50 chars raw but <= 50 after trimming, and verify they are accepted. Conversely, strings that are still > 50 after trimming should be rejected. This is covered by the same property as 12.1 since we always trim first.
  Classification: PROPERTY (same property as 12.1)
  Test Strategy: Covered by the length enforcement property — generators produce strings with varying whitespace.

### Property Reflection

After reviewing all identified properties:

1. **Sync creates with alwaysAnonymous: false** (1.2) — unique, tests creation path.
2. **Sync preserves alwaysAnonymous on update** (1.3) — unique, tests update path.
3. **needsOnboarding derivation** (2.1, 2.2) — single property covering both redirect and skip cases.
4. **updateProfile name round-trip** (3.3, 3.4, 9.3, 10.3, 10.5) — one comprehensive property: for any valid name and alwaysAnonymous combination, calling updateProfile then reading back should match.
5. **updateProfile rejects empty name when not anonymous** (3.5, 9.5) — single validation property.
6. **updateProfile with only alwaysAnonymous preserves name** (4.3) — can be combined with property 4 as a sub-case (when only alwaysAnonymous is passed, name is untouched). Keeping separate for clarity since it tests partial updates specifically.
7. **Submission form alias derivation** (6.1, 6.2, 7.1, 7.2) — single property: given any user document, the derived alias value and disabled state follow a deterministic function.
8. **Backend anonymity enforcement** (8.1, 8.2) — single property: the final submittedBy value in a submission is determined solely by user.alwaysAnonymous and the client input.
9. **updateProfile rejects names exceeding 50 characters** (12.1, 12.2) — single property: any name whose trimmed length exceeds DISPLAY_NAME_MAX_LENGTH is rejected server-side. Distinct from property 5 (empty name) since it validates the upper bound rather than the lower bound.

Redundancy eliminated:
- Properties 3.3, 3.4, 9.3, 10.3, 10.5 → consolidated into one "updateProfile round-trip" property.
- Properties 3.5, 9.5 → consolidated into one "empty name rejection" property.
- Properties 6.1, 6.2, 7.1, 7.2 → consolidated into one "alias field derivation" property.
- Properties 8.1, 8.2 → consolidated into one "anonymity enforcement" property.
- Properties 12.1, 12.2 → consolidated into one "name length enforcement" property (distinct from the empty-name property since it covers a different validation path).

Final unique properties: **8 properties**.

---

### Property 1: New user sync initializes alwaysAnonymous to false

*For any* valid UserIdentity that does not correspond to an existing user in the database, when `users.sync` is called, the newly created user document SHALL have `alwaysAnonymous === false`.

**Validates: Requirements 1.2**

### Property 2: Sync preserves alwaysAnonymous on existing users

*For any* existing user document with any value of `alwaysAnonymous` (true or false), when `users.sync` is called again with updated identity fields (email, name, imageUrl), the `alwaysAnonymous` field SHALL remain unchanged.

**Validates: Requirements 1.3**

### Property 3: Needs-onboarding derivation

*For any* user document, `needsOnboarding` is `true` if and only if `name` is empty/undefined AND `alwaysAnonymous === false`. In all other cases (non-empty name OR `alwaysAnonymous === true`), `needsOnboarding` is `false`.

**Validates: Requirements 2.1, 2.2**

### Property 4: updateProfile round-trip preserves values

*For any* authenticated user and any valid `name` string (non-empty after trimming) and any boolean `alwaysAnonymous` value, calling `users.updateProfile({ name, alwaysAnonymous })` and then reading the user document back via `users.getMe` SHALL return a document where `name` equals the trimmed input and `alwaysAnonymous` equals the provided boolean.

**Validates: Requirements 3.3, 3.4, 4.2, 9.3, 10.3, 10.5**

### Property 5: updateProfile rejects empty name unless anonymous

*For any* string composed entirely of whitespace (including the empty string), calling `users.updateProfile({ name: whitespaceString, alwaysAnonymous: false })` SHALL be rejected with an error, and the user document SHALL remain unchanged.

**Validates: Requirements 3.5, 9.5**

### Property 6: Submission alias field derivation

*For any* user document, the submission form alias field value and disabled state are derived deterministically:
- If `alwaysAnonymous === true`: value is `"Anonymous"` and field is disabled.
- Else if `name` is non-empty: value is `user.name` and field is enabled.
- Else: value is empty string and field is enabled.

**Validates: Requirements 6.1, 6.2, 7.1, 7.2**

### Property 7: Backend anonymity enforcement on submission

*For any* submission where the submitting user has `alwaysAnonymous === true`, regardless of the `submittedBy` value provided by the client, the persisted submission document SHALL have `submittedBy === "Anonymous"`. Conversely, *for any* submission where `alwaysAnonymous === false`, the persisted `submittedBy` SHALL equal the client-provided value (trimmed, or undefined if empty).

**Validates: Requirements 8.1, 8.2**

### Property 8: updateProfile rejects names exceeding 50 characters

*For any* string whose trimmed length exceeds 50 characters (`DISPLAY_NAME_MAX_LENGTH`), calling `users.updateProfile({ name: longString })` SHALL be rejected with an error, and the user document SHALL remain unchanged. Conversely, *for any* string whose trimmed length is between 1 and 50 characters (inclusive), the name SHALL be accepted (assuming other validations pass).

**Validates: Requirements 12.1, 12.2**
