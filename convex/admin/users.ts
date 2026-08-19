import { query } from '../_generated/server'
import { requireAdmin } from '../lib/auth'

/**
 * Returns the 50 most recently created users (excluding soft-deleted ones),
 * ordered newest-first. Admin-only.
 *
 * The frontend handles anonymization display logic — if a user has
 * `alwaysAnonymous: true`, the UI renders a generic placeholder instead of
 * exposing their profile details.
 */
export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)

    return ctx.db
      .query('users')
      .order('desc')
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .take(50)
  },
})
