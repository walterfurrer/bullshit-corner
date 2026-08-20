/**
 * Shared constants used by both the Convex backend and the client app.
 *
 * This file must remain free of any framework or runtime-specific imports
 * so both the Convex bundler and the Vite bundler can consume it.
 */

/** Maximum allowed character count for a display name after trimming. */
export const DISPLAY_NAME_MAX_LENGTH = 50

/** Maximum character count for a topic title. */
export const TITLE_MAX = 200

/** Submission field length limits. */
export const SUBMISSION_LIMITS = {
  topic: 200,
  alias: 100,
  details: 1000,
  youtubeUrl: 500,
} as const

/** Maximum character count for a beta feedback message after trimming. */
export const FEEDBACK_MESSAGE_MAX_LENGTH = 2000

/** Maximum character count for the route captured with beta feedback. */
export const FEEDBACK_PAGE_PATH_MAX_LENGTH = 500
