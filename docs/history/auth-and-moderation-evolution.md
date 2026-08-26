# Authentication and moderation evolution

This is a concise record of decisions made while Bullshit Corner gained authenticated submissions, user privacy controls, and moderation. It provides context only; the current code, tests, `README.md`, and `AGENTS.md` are authoritative.

## Submissions

- The leaderboard and submission form remain publicly accessible, but creating a submission requires a Clerk-authenticated account.
- Every submission belongs to the authenticated Convex user. The client cannot provide an owner ID or email, and submission records do not duplicate email addresses.
- A name or alias is optional. Empty aliases stay empty rather than being replaced with a display string. Users are limited to six submissions in a seven-day fixed window, keyed by their authenticated user record.
- Owners can now view, edit, and delete their own submissions. Deleting a promoted submission retains its leaderboard entry and changes its attribution to `Anonymous`.

## Identity and privacy

- New authenticated users choose a display name during onboarding or opt into always-anonymous submissions. The profile page is `/userSettings`.
- The server, not the client, enforces the always-anonymous preference. Changing this preference or a display name updates existing submission attribution to match.
- Account deletion anonymizes the user's submissions and removes their personal profile data while retaining the minimal record needed for data integrity.

## Administration

- Clerk `publicMetadata.role === "admin"` is the sole admin-role authority.
- Admin access is enforced both in the TanStack Start route layer and in Convex functions; hiding admin UI is not authorization.
- Admins manage leaderboard entries and review submitted topics. Role changes take effect with refreshed Clerk session state; no application deployment is required.

## Resolved implementation incidents

- Admin refresh handling was corrected so server-side access checks use the authoritative Clerk user metadata rather than an assumed JWT claim shape.
- Authenticated navigation and header rendering were adjusted to avoid client-side use of server-only auth APIs and to reserve avatar space during auth hydration.

## Superseded records

The original Kiro files recorded completed work and early designs. In particular, they refer to the former `/settings` route and an older `ENABLE_AUTH` name, describe an initial anonymous/email submission model, and characterize “Your Submissions” as read-only. Those details no longer describe the application.
