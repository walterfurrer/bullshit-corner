# Requirements Document

## Introduction

A protected "Your Submissions" page that lets authenticated users view their own past topic nominations. The page is read-only (no edit/delete), auth-gated (inaccessible to anonymous users), and cross-linked with the existing Nominate page. The navigation bar conditionally shows the route only when the user is signed in.

## Glossary

- **App**: The Bullshit Corner web application (TanStack Start + Convex + Clerk)
- **Router**: TanStack Router file-based routing system
- **Navigation_Bar**: The site header component (`site-header.tsx`) containing nav links and auth UI
- **Submissions_Page**: The new `/your-submissions` route displaying the current user's submissions
- **Submission_Card**: A visual card component rendering a single submission's data (topic, evidence, alias)
- **Convex_Backend**: The Convex serverless backend hosting the `submissions` table and query functions
- **Authenticated_User**: A user who has completed sign-in via Clerk and has a valid session
- **Anonymous_User**: A visitor who has not signed in or whose session has expired

## Requirements

### Requirement 1: Auth-gated route access

**User Story:** As an anonymous user, I want to be informed that sign-in is required when I navigate to the submissions page URL directly, so that I understand why I cannot see the content.

#### Acceptance Criteria

1. WHEN an Anonymous_User navigates to the Submissions_Page URL, THE App SHALL display a message stating "You must be logged in to see this page"
2. WHEN an Anonymous_User navigates to the Submissions_Page URL, THE App SHALL redirect the Anonymous_User to the home page (`/`) after a short delay or via user action
3. WHILE a user's authentication state is loading, THE App SHALL display a loading indicator on the Submissions_Page instead of the auth-required message or submission content

### Requirement 2: Custom user menu dropdown

**User Story:** As a signed-in user, I want a custom user menu (replacing Clerk's default UserButton) that gives me quick access to my submissions, account management, and sign-out in one place.

#### Acceptance Criteria

1. WHILE an Authenticated_User is signed in, THE Navigation_Bar SHALL display a custom user menu trigger (showing the user's avatar) in place of Clerk's default `<UserButton>` component
2. WHEN the Authenticated_User activates the user menu trigger, THE App SHALL display a dropdown menu containing: a "Your Submissions" link, a "Manage Account" action, and a "Sign Out" action
3. WHEN the user selects "Your Submissions", THE Router SHALL navigate to the Submissions_Page (`/your-submissions`)
4. WHEN the user selects "Manage Account", THE App SHALL open Clerk's UserProfile modal
5. WHEN the user selects "Sign Out", THE App SHALL sign the user out via Clerk
6. THE custom user menu SHALL render identically in both desktop and mobile navigation
7. WHILE an Anonymous_User is browsing, THE custom user menu SHALL NOT be displayed (the sign-in button remains unchanged)

### Requirement 3: Fetch and display user submissions

**User Story:** As a signed-in user, I want to see all topics I have previously submitted, so that I can review my contributions.

#### Acceptance Criteria

1. WHEN an Authenticated_User visits the Submissions_Page, THE Convex_Backend SHALL return only submissions belonging to that user (filtered by the `by_userId` index)
2. THE Submissions_Page SHALL display each submission as a Submission_Card showing the topic title
3. WHERE a submission has an evidence field, THE Submission_Card SHALL display the evidence text
4. WHERE a submission has a submittedBy (alias) field, THE Submission_Card SHALL display the alias
5. THE Submissions_Page SHALL order submissions from newest to oldest (descending `submittedAt`)
6. WHEN an Authenticated_User has zero submissions, THE Submissions_Page SHALL display an empty-state message indicating no submissions exist yet

### Requirement 4: Read-only view

**User Story:** As a user, I want my submissions page to be a simple read-only list, so that I can review without risk of accidental changes.

#### Acceptance Criteria

1. THE Submissions_Page SHALL NOT provide edit controls for any submission
2. THE Submissions_Page SHALL NOT provide delete controls for any submission

### Requirement 5: Link to Nominate page from Submissions page

**User Story:** As a signed-in user viewing my submissions, I want a way to navigate to the Nominate page, so that I can easily submit a new topic.

#### Acceptance Criteria

1. THE Submissions_Page SHALL display a link or button labeled to navigate to the `/nominate` route
2. WHEN the Authenticated_User activates the link, THE Router SHALL navigate to the Nominate page

### Requirement 6: Cross-link from Nominate page

**User Story:** As a signed-in user on the Nominate page, I want a link to view my past submissions, so that I can check what I have already nominated.

#### Acceptance Criteria

1. WHILE an Authenticated_User is on the Nominate page, THE App SHALL display a link (e.g. "View your submissions here") navigating to the Submissions_Page
2. WHILE an Anonymous_User is on the Nominate page, THE App SHALL NOT display the cross-link to the Submissions_Page

### Requirement 7: Convex query for user submissions

**User Story:** As a developer, I want a dedicated Convex query function that returns a user's submissions, so that the frontend can fetch data efficiently and securely.

#### Acceptance Criteria

1. THE Convex_Backend SHALL expose a query function that accepts no user-identifier argument and instead derives the caller's identity server-side via `ctx.auth.getUserIdentity()`
2. IF an unauthenticated request calls the query, THEN THE Convex_Backend SHALL return an empty array (not throw)
3. THE query SHALL use the existing `by_userId` index on the `submissions` table to fetch results efficiently
4. THE query SHALL return results ordered by `submittedAt` descending, bounded to a reasonable limit (e.g. 50 most recent)
