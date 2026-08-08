# Requirements Document

## Introduction

The topic-submission feature adds a public-facing form to the Bullshit Corner leaderboard site, letting viewers nominate debate topics for the hosts without requiring an account or sign-in. Submitted topics land in a `submissions` table in Convex, separate from the curated `topics` leaderboard, awaiting host review. The form is built with TanStack Form, uses shadcn/ui Input and Textarea primitives, and is styled with Tailwind CSS v4.

## Glossary

- **Submission_Form**: The React client component that renders the three-field topic submission form.
- **Submission**: A viewer-nominated topic record stored in the `submissions` Convex table, distinct from the ranked `topics` table.
- **Submission_Mutation**: The public Convex mutation that writes a new Submission document.
- **Topic_Field**: The required "Bullshit Corner Topic" text input — the headline of the submitted idea.
- **Evidence_Field**: The optional "Evidence" textarea where the viewer pleads their case.
- **Alias_Field**: The optional "Name/Alias" text input; stored as "Anonymous Viewer" when left blank.
- **Validator**: The client-side validation layer provided by TanStack Form that enforces field constraints before the form may be submitted.

---

## Requirements

### Requirement 1: Submission Form Rendering

**User Story:** As a viewer, I want to see a submission form on the site so that I can nominate a topic for the hosts to debate.

#### Acceptance Criteria

1. THE Submission_Form SHALL render a text input labelled "Bullshit Corner Topic".
2. THE Submission_Form SHALL render a textarea labelled "Evidence" with placeholder text "Plead your case here."
3. THE Submission_Form SHALL render a text input labelled "Name/Alias".
4. THE Submission_Form SHALL render a submit button labelled "Submit Topic".
5. THE Submission_Form SHALL use a shadcn/ui `Input` component for the Topic_Field and Alias_Field.
6. THE Submission_Form SHALL use a shadcn/ui `Textarea` component for the Evidence_Field.

---

### Requirement 2: Field Validation

**User Story:** As a viewer, I want the form to tell me when my submission is incomplete so that I don't accidentally submit an empty topic.

#### Acceptance Criteria

1. WHEN a viewer attempts to submit the form with an empty Topic_Field, THE Validator SHALL prevent form submission and display an inline error message on the Topic_Field.
2. WHEN the Topic_Field contains at least one non-whitespace character, THE Validator SHALL clear any inline error message on the Topic_Field.
3. THE Validator SHALL treat the Evidence_Field as optional and SHALL NOT block submission when the Evidence_Field is empty.
4. THE Validator SHALL treat the Alias_Field as optional and SHALL NOT block submission when the Alias_Field is empty.
5. WHEN a viewer submits the form with an Alias_Field value that contains only whitespace, THE Submission_Form SHALL substitute "Anonymous Viewer" before forwarding the data to the Submission_Mutation.

---

### Requirement 3: Submitting a Topic

**User Story:** As a viewer, I want to submit my nominated topic so that the hosts can consider it for a future episode.

#### Acceptance Criteria

1. WHEN a viewer submits a valid form, THE Submission_Form SHALL call the Submission_Mutation with `topic` (trimmed Topic_Field value), `evidence` (trimmed Evidence_Field value or `undefined` when empty), and `submittedBy` (trimmed Alias_Field value, or `"Anonymous Viewer"` when blank).
2. THE Submission_Mutation SHALL insert a new document into the `submissions` Convex table containing the `topic`, optional `evidence`, `submittedBy`, and `submittedAt` (server-side timestamp via `Date.now()`).
3. WHILE a submission is in-flight, THE Submission_Form SHALL disable the submit button and show a visual loading indicator to the viewer.
4. WHEN the Submission_Mutation succeeds, THE Submission_Form SHALL reset all fields to their initial empty state.
5. WHEN the Submission_Mutation succeeds, THE Submission_Form SHALL display a non-blocking success message confirming the topic was received.
6. IF the Submission_Mutation returns an error, THEN THE Submission_Form SHALL display an inline error message and SHALL NOT reset the field values, so the viewer can correct and resubmit.

---

### Requirement 4: Anonymous Submissions (No Authentication)

**User Story:** As a viewer, I want to submit a topic without creating an account so that the process is frictionless.

#### Acceptance Criteria

1. THE Submission_Mutation SHALL accept and store submissions without requiring an authenticated session.
2. THE Submission_Mutation SHALL NOT call `ctx.auth.getUserIdentity()` for authorization and SHALL NOT reject requests where the identity is `null`.
3. THE Submission_Form SHALL NOT render any sign-in prompt, auth gate, or account-related UI.

---

### Requirement 5: Submission Data Storage

**User Story:** As a host or admin, I want submitted topics stored separately from the ranked leaderboard so that raw viewer submissions are preserved for review without polluting the curated list.

#### Acceptance Criteria

1. THE Submission_Mutation SHALL write to a `submissions` table that is separate from the existing `topics` table.
2. THE `submissions` table schema SHALL define `topic` as a required `v.string()`, `evidence` as an optional `v.string()`, `submittedBy` as a required `v.string()` (defaulted to "Anonymous Viewer" before mutation call), and `submittedAt` as a required `v.number()`.
3. THE `submissions` table schema SHALL include an index `by_submittedAt` on `["submittedAt"]` to support chronological listing.

---

### Requirement 6: Spam and Abuse Mitigation

**User Story:** As a host, I want basic length limits on submissions so that no single submission can flood the database with megabytes of text.

#### Acceptance Criteria

1. THE Validator SHALL enforce a maximum length of 200 characters on the Topic_Field and SHALL display an inline error when exceeded.
2. THE Validator SHALL enforce a maximum length of 2000 characters on the Evidence_Field and SHALL display an inline error when exceeded.
3. THE Validator SHALL enforce a maximum length of 100 characters on the Alias_Field and SHALL display an inline error when exceeded.
4. IF the `topic` argument received by the Submission_Mutation exceeds 200 characters, THEN THE Submission_Mutation SHALL throw a validation error and SHALL NOT insert the document.
5. IF the `evidence` argument received by the Submission_Mutation exceeds 2000 characters, THEN THE Submission_Mutation SHALL throw a validation error and SHALL NOT insert the document.
6. IF the `submittedBy` argument received by the Submission_Mutation exceeds 100 characters, THEN THE Submission_Mutation SHALL throw a validation error and SHALL NOT insert the document.
