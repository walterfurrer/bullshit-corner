# Requirements Document

## Introduction

The topic-submission feature provides a publicly accessible form on Bullshit Corner. Visitors can complete the form while signed out, but submitting requires a Clerk account. Convex verifies the Clerk identity, synchronizes it to a private `users` record, and stores every nomination with a required user owner. Submitted topics remain separate from the curated `topics` leaderboard while awaiting review.

## Glossary

- **Submission_Form**: The public React form for creating a nomination.
- **Submission**: A user-owned nomination stored in the Convex `submissions` table.
- **Submission_Mutation**: The authenticated Convex mutation that validates and stores a Submission.
- **Topic_Field**: The required nomination title.
- **Evidence_Field**: Optional supporting evidence.
- **Alias_Field**: An optional pseudonym shown to future administrators; it is not a verified identity.
- **Authenticated_User**: A Clerk identity validated by Convex and mapped to a Convex `users` document.

## Requirements

### Requirement 1: Public form rendering

**User Story:** As a visitor, I want to prepare a nomination before creating an account.

#### Acceptance Criteria

1. `/nominate` SHALL remain accessible to signed-out visitors.
2. The form SHALL render Topic, optional Evidence, and optional Name/Alias fields.
3. The form SHALL NOT render an email field.
4. The page SHALL explain that a free account is required to submit.
5. Entered values SHALL remain intact when Clerk authentication opens.

### Requirement 2: Field validation and normalization

**User Story:** As a viewer, I want clear validation so I can correct my nomination before submitting.

#### Acceptance Criteria

1. A blank or whitespace-only Topic SHALL be rejected.
2. Topic SHALL be trimmed and limited to 200 characters.
3. Evidence SHALL be trimmed, omitted when blank, and limited to 2,000 characters.
4. Alias SHALL be trimmed, omitted when blank, and limited to 100 characters.
5. A blank Alias SHALL NOT be replaced with an anonymous-display string.
6. Client and Convex validation SHALL enforce the same limits.

### Requirement 3: Authentication at submission time

**User Story:** As a signed-out visitor, I want to keep using the public site and only authenticate when I submit.

#### Acceptance Criteria

1. Public pages and public Convex queries SHALL remain available without authentication.
2. Attempting to submit while signed out SHALL open Clerk's sign-in flow rather than call the mutation.
3. Clerk's flow SHALL allow an existing user to sign in or a new user to create an account.
4. After authentication, the form SHALL retain its draft and request one explicit confirmation click before writing.
5. The submit control SHALL be disabled while Clerk/Convex auth is loading, refreshing, or the mutation is running.

### Requirement 4: Authenticated ownership

**User Story:** As an administrator, I want each nomination tied to a verified account without exposing the user's email on the submission.

#### Acceptance Criteria

1. The Submission_Mutation SHALL reject a missing or invalid Convex identity.
2. Ownership SHALL be derived only from `ctx.auth.getUserIdentity()`.
3. User lookup SHALL use `identity.tokenIdentifier` as its canonical key.
4. The mutation SHALL NOT accept `userId` or email from the client.
5. The `users` table SHALL privately retain available Clerk profile claims, including email when present.
6. The `submissions` table SHALL NOT duplicate email.

### Requirement 5: Data storage

**User Story:** As an administrator, I want normalized user and submission records for future moderation workflows.

#### Acceptance Criteria

1. `users` SHALL contain one idempotently synchronized record per `tokenIdentifier`.
2. `submissions.userId` SHALL be a required `v.id('users')`.
3. `submittedBy` SHALL be optional and treated only as a pseudonym.
4. `submittedAt` SHALL be generated server-side with `Date.now()`.
5. `submissions` SHALL retain `by_submittedAt` and `by_userId` indexes.
6. User synchronization and first submission SHALL share an authenticated get-or-create path so a client-sync race cannot prevent submission.

### Requirement 6: Spam and abuse mitigation

**User Story:** As a host, I want account-based limits and bounded field sizes.

#### Acceptance Criteria

1. The server SHALL enforce all Topic, Evidence, and Alias limits.
2. Each authenticated user SHALL be limited to six submissions per seven-day fixed window.
3. The rate-limit key SHALL be the resolved Convex user ID, not caller-supplied email or alias.
4. Rate-limit errors SHALL preserve the draft and show an actionable message.
