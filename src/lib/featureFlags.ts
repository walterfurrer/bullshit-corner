/**
 * Feature flags — simple env-var-based toggles.
 *
 * Add new flags here as the app grows. Each flag reads a VITE_* env var
 * so it can be toggled per-environment (local, preview, production) without
 * code changes.
 */

/**
 * When `false` (the default), all sign-in / account UI is hidden and
 * users cannot create accounts or authenticate.
 *
 * Set `VITE_ENABLE_AUTH=true` in your env to re-enable.
 */
export const ENABLE_AUTH =
  import.meta.env.VITE_ENABLE_AUTH === 'true'

/**
 * Enables the private-beta notice and authenticated feedback tools.
 * Keep this false for production and ordinary engineering previews.
 */
export const ENABLE_TEST_FEEDBACK =
  import.meta.env.VITE_ENABLE_TEST_FEEDBACK === 'true'
