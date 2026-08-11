# Requirements Document

## Introduction

This feature introduces a post-sign-up onboarding flow where new users choose a display name or opt into permanent anonymity, and a settings page where returning users can update these preferences. The submission form auto-populates the user's name and respects the anonymous preference both on the client and server.

## Glossary

- **Onboarding_Page**: The `/onboarding` route displayed to newly signed-up users after Clerk authentication completes.
- **Settings_Page**: The `/settings` route where authenticated users manage their display name and anonymity preference.
- **Submission_Form**: The existing topic submission form component at `/submit-topic`.
- **Users_Table**: The Convex `users` table storing user profile data.
- **Sync_Mutation**: The existing `users.sync` Convex mutation that creates or updates a user record on authentication.
- **Submit_Mutation**: The existing `submissions.submit` Convex mutation that records a topic submission.
- **UpdateProfile_Mutation**: The `users.updateProfile` Convex mutation that saves display name and anonymity preference changes.
- **Display_Name**: The `name` field on the Users_Table representing the user's chosen public name (maximum 50 characters after trimming).
- **DISPLAY_NAME_MAX_LENGTH**: The constant `50`, representing the maximum allowed character count for a Display_Name after trimming. Deliberately shorter than the 100-character alias limit on the Submission_Form because a display name is a concise identifier, not a freeform alias.
- **Always_Anonymous_Flag**: The `alwaysAnonymous` boolean field on the Users_Table indicating the user has opted for permanent anonymity.
- **Name_Alias_Input**: The "Name/Alias" text input field within the Submission_Form.
- **User_Menu**: The authenticated user dropdown menu in the app header/navigation.

## Requirements

### Requirement 1: Schema Extension

**User Story:** As a developer, I want the users table to track anonymity preference, so that the system can enforce anonymous submissions consistently.

#### Acceptance Criteria

1. THE Users_Table SHALL include an `alwaysAnonymous` field of type `v.boolean()`.
2. WHEN the Sync_Mutation creates a new user record, THE Sync_Mutation SHALL set `alwaysAnonymous` to `false`.
3. WHEN the Sync_Mutation updates an existing user record that lacks `alwaysAnonymous`, THE Sync_Mutation SHALL preserve the existing value without overwriting it.

### Requirement 2: Onboarding Redirect for New Users

**User Story:** As a new user, I want to be guided to set up my display name immediately after signing up, so that I can start using the app with my preferred identity.

#### Acceptance Criteria

1. WHEN a user completes sign-up via Clerk and the user's `name` field in the Users_Table is empty or undefined, THE Onboarding_Page SHALL be displayed at the `/onboarding` route.
2. WHEN an existing user signs in and already has a `name` value set or has `alwaysAnonymous` set to `true`, THE system SHALL skip the Onboarding_Page and navigate to the app home route.
3. WHILE the `ENABLE_AUTH` feature flag is `false`, THE system SHALL not redirect any user to the Onboarding_Page.

### Requirement 3: Onboarding Page — Name Entry

**User Story:** As a new user, I want to provide a display name during onboarding, so that my submissions are attributed to me.

#### Acceptance Criteria

1. THE Onboarding_Page SHALL display a text input for entering a display name.
2. THE Onboarding_Page SHALL display a "Save Name" button that submits the entered display name.
3. WHEN the user submits a display name, THE Onboarding_Page SHALL save the value to the `name` field in the Users_Table.
4. WHEN the user submits a display name, THE Onboarding_Page SHALL set `alwaysAnonymous` to `false` in the Users_Table.
5. WHEN the display name field is empty and the user attempts to save, THE Onboarding_Page SHALL display a validation error indicating a name is required.
6. WHEN the trimmed display name exceeds DISPLAY_NAME_MAX_LENGTH characters and the user attempts to save, THE Onboarding_Page SHALL display a validation error indicating the name must be 50 characters or fewer.

### Requirement 4: Onboarding Page — Skip (Always Anonymous)

**User Story:** As a new user who prefers anonymity, I want to skip name entry during onboarding, so that all my submissions are automatically anonymous.

#### Acceptance Criteria

1. THE Onboarding_Page SHALL display a "Stay Anonymous" button or link as an alternative to entering a name.
2. WHEN the user activates the "Stay Anonymous" option, THE Onboarding_Page SHALL set `alwaysAnonymous` to `true` in the Users_Table.
3. WHEN the user activates the "Stay Anonymous" option, THE Onboarding_Page SHALL leave the `name` field unchanged (empty/undefined) in the Users_Table.

### Requirement 5: Onboarding Confirmation

**User Story:** As a new user, I want confirmation that onboarding is complete, so that I know I can proceed to use the app.

#### Acceptance Criteria

1. WHEN onboarding completes (either name saved or anonymous selected), THE Onboarding_Page SHALL display a confirmation message indicating the choice was saved.
2. THE Onboarding_Page SHALL display a link or button to continue to the app home route after confirmation.

### Requirement 6: Submission Form — Auto-populate Name

**User Story:** As an authenticated user with a display name, I want the Name/Alias field pre-filled with my stored name, so that I do not have to re-type it each time.

#### Acceptance Criteria

1. WHILE the user is authenticated and has a non-empty `name` in the Users_Table, THE Submission_Form SHALL pre-populate the Name_Alias_Input with the stored `name` value.
2. WHILE the user is authenticated and `name` is empty or undefined, THE Submission_Form SHALL leave the Name_Alias_Input empty with its existing placeholder text.
3. THE Submission_Form SHALL allow the user to edit the pre-populated Name_Alias_Input value before submitting (when `alwaysAnonymous` is `false`).

### Requirement 7: Submission Form — Always Anonymous Behavior

**User Story:** As a user who opted for permanent anonymity, I want the submission form to clearly reflect my choice, so that I understand my submissions are anonymous.

#### Acceptance Criteria

1. WHILE `alwaysAnonymous` is `true` for the authenticated user, THE Submission_Form SHALL display "Anonymous" as the value in the Name_Alias_Input.
2. WHILE `alwaysAnonymous` is `true` for the authenticated user, THE Submission_Form SHALL disable the Name_Alias_Input so the user cannot modify it.
3. WHILE `alwaysAnonymous` is `true` and the user hovers over or focuses the disabled Name_Alias_Input, THE Submission_Form SHALL display a tooltip with the message "Change this in Settings to use a display name."
4. THE tooltip SHALL be accessible via keyboard focus (not hover-only).

### Requirement 8: Backend Enforcement of Anonymity

**User Story:** As a system administrator, I want the server to enforce anonymity regardless of client input, so that the anonymous preference cannot be bypassed.

#### Acceptance Criteria

1. WHEN a submission is created and the submitting user has `alwaysAnonymous` set to `true`, THE Submit_Mutation SHALL set `submittedBy` to `"Anonymous"` regardless of the `submittedBy` value provided by the client.
2. WHEN a submission is created and the submitting user has `alwaysAnonymous` set to `false`, THE Submit_Mutation SHALL use the client-provided `submittedBy` value (existing behavior).

### Requirement 9: Settings Page — Display Name Editing

**User Story:** As an authenticated user, I want to update my display name from a settings page, so that I can change how I am identified on submissions.

#### Acceptance Criteria

1. THE Settings_Page SHALL be accessible at the `/settings` route.
2. THE Settings_Page SHALL display a text input pre-filled with the user's current `name` from the Users_Table.
3. WHEN the user saves a new display name, THE Settings_Page SHALL update the `name` field in the Users_Table.
4. WHEN the display name is saved successfully, THE Settings_Page SHALL display a confirmation message.
5. IF the user attempts to save an empty display name while `alwaysAnonymous` is `false`, THEN THE Settings_Page SHALL display a validation error indicating a name is required.
6. IF the trimmed display name exceeds DISPLAY_NAME_MAX_LENGTH characters, THEN THE Settings_Page SHALL display a validation error indicating the name must be 50 characters or fewer.

### Requirement 10: Settings Page — Anonymous Toggle

**User Story:** As an authenticated user, I want to toggle my anonymity preference from settings, so that I can switch between named and anonymous submissions.

#### Acceptance Criteria

1. THE Settings_Page SHALL display a checkbox (or toggle) labeled to indicate always-anonymous preference.
2. THE checkbox SHALL reflect the current value of `alwaysAnonymous` from the Users_Table.
3. WHEN the user enables the always-anonymous toggle, THE Settings_Page SHALL set `alwaysAnonymous` to `true` in the Users_Table.
4. WHEN the user disables the always-anonymous toggle and the user has an empty `name`, THE Settings_Page SHALL prompt the user to enter a display name before saving.
5. WHEN the user disables the always-anonymous toggle and the user has a non-empty `name`, THE Settings_Page SHALL set `alwaysAnonymous` to `false` in the Users_Table.

### Requirement 11: Settings Page Navigation

**User Story:** As an authenticated user, I want to access settings from the user menu, so that I can find the page without searching.

#### Acceptance Criteria

1. THE User_Menu SHALL include a "Settings" link that navigates to the `/settings` route.
2. THE "Settings" link SHALL appear alongside existing menu items ("Your Submissions", "Manage Account").

### Requirement 12: Server-Side Display Name Length Enforcement

**User Story:** As a system administrator, I want the server to reject display names exceeding 50 characters, so that the constraint cannot be bypassed by a crafted client request.

#### Acceptance Criteria

1. WHEN the UpdateProfile_Mutation receives a `name` argument whose trimmed length exceeds DISPLAY_NAME_MAX_LENGTH, THE UpdateProfile_Mutation SHALL reject the request with an error indicating the name must be 50 characters or fewer.
2. THE UpdateProfile_Mutation SHALL apply the length check after trimming whitespace from the provided name value.

### Requirement 13: Feature Flag Gating

**User Story:** As a developer, I want onboarding and settings gated behind the auth feature flag, so that these features are not exposed when auth is disabled.

#### Acceptance Criteria

1. WHILE `ENABLE_AUTH` is `false`, THE system SHALL not render the Onboarding_Page even if navigated to directly (redirect to home or show not-found).
2. WHILE `ENABLE_AUTH` is `false`, THE system SHALL not render the Settings_Page even if navigated to directly (redirect to home or show not-found).
3. WHILE `ENABLE_AUTH` is `false`, THE Submission_Form SHALL not auto-populate or disable the Name_Alias_Input based on user data (maintain existing unauthenticated behavior).
