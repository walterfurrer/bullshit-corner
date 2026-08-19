import { v } from 'convex/values'

import { query } from './_generated/server'

// ─── Query ────────────────────────────────────────────────────────────────────

export const listRanked = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return ctx.db
      .query('bullshitCornerEntries')
      .withIndex('by_ranking')
      .order('asc')
      .take(args.limit ?? 50)
  },
})
