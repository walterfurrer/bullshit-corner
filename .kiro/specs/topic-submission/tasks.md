# Implementation Plan: topic-submission

## Overview

Implement a public topic submission form on the Bullshit Corner site. The work touches three layers: the Convex backend (schema + mutation), shared constants and pure utility functions, and the React UI (route + form component). Tasks are ordered so each step can be verified before building on top of it.

## Tasks

- [x] 1. Extend the Convex schema and install shadcn/ui components
  - Add the `submissions` table definition to `convex/schema.ts` with fields `topic` (`v.string()`), `evidence` (`v.optional(v.string())`), `submittedBy` (`v.string()`), `submittedAt` (`v.number()`), and the `by_submittedAt` index on `["submittedAt"]`
  - Install the required shadcn/ui primitives by running: `pnpm dlx shadcn@latest add input textarea button label`
  - _Requirements: 5.1, 5.2, 5.3, 1.5, 1.6_

- [x] 2. Create the shared constants module and pure utility functions
  - [x] 2.1 Create `src/lib/submission-constants.ts` exporting `SUBMISSION_LIMITS` with `topic: 200`, `evidence: 2000`, `alias: 100`
    - These values are used by both client validators and the Convex mutation (duplicated in the mutation file to avoid cross-boundary imports)
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 2.2 Create `src/lib/submission-utils.ts` exporting `validateTopic`, `validateLength`, and `normalizeSubmission`
    - `validateTopic(value: string): string | undefined` — returns an error string when the value is empty or whitespace-only, `undefined` otherwise
    - `validateLength(value: string, max: number): string | undefined` — returns an error string when `value.length > max`, `undefined` otherwise
    - `normalizeSubmission(values: { topic: string; evidence: string; alias: string })` — returns `{ topic: string; evidence: string | undefined; submittedBy: string }` applying trim + fallback rules
    - _Requirements: 2.1, 2.2, 2.5, 3.1, 6.1, 6.2, 6.3_

  - [ ]* 2.3 Write unit tests for pure utility functions in `src/lib/submission-utils.test.ts`
    - Test `validateTopic` with empty string, single space, and a valid string
    - Test `validateLength` with a string exactly at the max, one character over, and one under
    - Test `normalizeSubmission` with: empty alias → `"Anonymous Viewer"`, whitespace alias → `"Anonymous Viewer"`, whitespace evidence → `undefined`, all valid values
    - _Requirements: 2.1, 2.2, 2.5, 3.1_

  - [ ]* 2.4 Write property test for Property 1: topic validator partitions inputs correctly
    - **Property 1: Topic validator correctly partitions valid and invalid inputs**
    - **Validates: Requirements 2.1, 2.2**
    - Use `fast-check` with `fc.string()` generator; for each generated string assert that `validateTopic` returns a string when `value.trim().length === 0` and `undefined` otherwise
    - Tag with comment: `// Feature: topic-submission, Property 1`
    - Run with `{ numRuns: 100 }`

  - [ ]* 2.5 Write property test for Property 2: submission normalization is deterministic and correct
    - **Property 2: Submission normalization is deterministic and correct**
    - **Validates: Requirements 2.5, 3.1**
    - Use `fast-check` with `fc.record({ topic: fc.string(), evidence: fc.string(), alias: fc.string() })`; assert trim rules, evidence omission when whitespace-only, and alias fallback to `"Anonymous Viewer"` when whitespace-only
    - Tag with comment: `// Feature: topic-submission, Property 2`
    - Run with `{ numRuns: 100 }`

  - [ ]* 2.6 Write property test for Property 3: length validators enforce field length limits (client side)
    - **Property 3: Length validators enforce field length limits**
    - **Validates: Requirements 6.1, 6.2, 6.3**
    - Use `fast-check` with `fc.nat({ max: 300 })` to generate string lengths; for each of the three max values (200, 2000, 100), generate strings at, below, and above the limit and assert `validateLength` returns `undefined` at/below and a non-empty string above
    - Tag with comment: `// Feature: topic-submission, Property 3 (client)`
    - Run with `{ numRuns: 100 }`

- [x] 3. Checkpoint — verify pure utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement the Convex `submissions.submit` public mutation
  - [x] 4.1 Create `convex/submissions.ts` with the `submit` public mutation
    - Import `mutation` from `./_generated/server` and `v` from `convex/values`; import `ConvexError` from `convex/values`
    - Inline the same limit constants from the design (`TOPIC_MAX = 200`, `EVIDENCE_MAX = 2000`, `ALIAS_MAX = 100`)
    - Validate arg lengths server-side; throw `ConvexError` with a human-readable message for each violation (topic > 200, evidence > 2000, submittedBy > 100)
    - Insert with `submittedAt: Date.now()` and return the new document `_id`
    - No auth check — the mutation must accept unauthenticated calls
    - _Requirements: 3.2, 4.1, 4.2, 5.1, 5.2, 6.4, 6.5, 6.6_

  - [ ]* 4.2 Write Convex integration tests in `convex/submissions.test.ts`
    - Use `convex-test` with `@edge-runtime/vm`; pass `import.meta.glob("./**/*.ts")` as the module map
    - Happy path: insert a valid submission and verify the document exists in the `submissions` table with correct fields
    - Server-side length guard: submit a `topic` of 201 characters, expect the mutation to throw
    - `submittedAt` is server-generated: verify the stored value is a `number`
    - `evidence` absent when `undefined`: submit without evidence, verify the field is absent on the stored document
    - _Requirements: 3.2, 4.1, 5.2, 6.4, 6.5, 6.6_

  - [ ]* 4.3 Write property test for Property 3: mutation server-side length guards
    - **Property 3: Length validators and mutation guards enforce field length limits (server side)**
    - **Validates: Requirements 6.4, 6.5, 6.6**
    - Use `convex-test` + `fast-check`; for each field generate strings that exceed and meet the limit; assert the mutation throws `ConvexError` when exceeded and succeeds when within limits
    - Tag with comment: `// Feature: topic-submission, Property 3 (server)`
    - Run with `{ numRuns: 20 }` (integration tests are slower)

- [x] 5. Checkpoint — verify Convex mutation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement the `SubmissionForm` component
  - [x] 6.1 Create `src/components/submission-form.tsx` with the TanStack Form instance and field wiring
    - Import `useForm` from `@tanstack/react-form`; import `useMutation` from `@tanstack/react-query`; import `useConvexMutation` from `@convex-dev/react-query`; import `api` from `../../convex/_generated/api`
    - Import `validateTopic`, `validateLength`, `normalizeSubmission` from `#/lib/submission-utils`
    - Import `SUBMISSION_LIMITS` from `#/lib/submission-constants`
    - Import shadcn/ui `Input`, `Textarea`, `Button`, `Label` from `#/components/ui/*` using `#/*` alias
    - Default values: `topic: ''`, `evidence: ''`, `alias: ''`
    - Wire `form.Field` for each of the three fields with `validators.onChange` (and `onBlur` for topic required check); render `field.state.meta.errors` below each input, gated on `field.state.meta.isTouched`
    - `onSubmit` callback: call `normalizeSubmission`, call `mutateAsync`, on success call `form.reset()` and set `submitStatus` to `'success'`; on error set `submitStatus` to `'error'` and `submitError` message; extract human-readable message from `ConvexError.data` if present, otherwise fall back to generic string
    - While in-flight (`form.state.isSubmitting`): disable submit button and show loading indicator
    - Render a success banner when `submitStatus === 'success'`; render an error banner when `submitStatus === 'error'`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.3, 3.4, 3.5, 3.6, 4.3_

  - [x] 6.2 Install `@tanstack/react-form` dependency if not already present
    - Run `pnpm add @tanstack/react-form` to add the package
    - Verify the import resolves in `src/components/submission-form.tsx`
    - _Requirements: 1.1–1.6, 2.1–2.5_

- [x] 7. Create the `/submit` route
  - [x] 7.1 Create `src/routes/submit.tsx` as a TanStack Router file route
    - Export `Route = createFileRoute('/submit')({ component: SubmitPage })`
    - `SubmitPage` renders the same page shell used on the home route (`SiteHeader`, `SiteFooter`) with `min-h-dvh` on the outer wrapper and a centred `max-w-2xl` content column
    - Import and render `SubmissionForm` from `#/components/submission-form`
    - No loader needed — the form has no initial data to prefetch
    - _Requirements: 1.1–1.6, 4.3_

  - [x] 7.2 Regenerate the route tree
    - Run `pnpm generate-routes` to update `src/routeTree.gen.ts` so TanStack Router picks up the new `/submit` route
    - _Requirements: 1.1–1.6_

- [x] 8. Final checkpoint — verify the full feature end-to-end
  - Ensure all tests pass, ask the user if questions arise.
  - Smoke-test checklist (manual):
    - `/submit` renders with all three fields and a submit button
    - Submitting with an empty topic shows an inline error and does not call the mutation
    - Submitting with a valid topic inserts a document in the Convex `submissions` table, shows the success banner, and resets the form
    - Submitting with a 201-character topic triggers both the client validator and (if bypassed) the server guard
    - Submitting with a blank alias stores `"Anonymous Viewer"` in the database

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `@tanstack/react-form` may not be listed in `package.json` yet — task 6.2 adds it; check before implementing 6.1
- Import alias is `#/*` throughout — never `@/*`
- All Tailwind utilities must use v4 names (e.g. `shadow-xs`, `rounded-xs`, `blur-xs`)
- `convex/submissions.ts` duplicates the limit constants rather than importing from `src/` — cross-boundary imports are unsupported
- Convex integration tests live inside `convex/` and require `/// <reference types="vite/client" />` only on files using `import.meta.glob`
- `convex-test` requires `@edge-runtime/vm` and vitest configured with `environment: "edge-runtime"`
- Property tests reference design property numbers in comments for traceability

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "4.1"] },
    { "id": 2, "tasks": ["2.3", "2.4", "2.5", "2.6", "4.2", "4.3"] },
    { "id": 3, "tasks": ["6.1"] },
    { "id": 4, "tasks": ["6.2", "7.1"] },
    { "id": 5, "tasks": ["7.2"] }
  ]
}
```
