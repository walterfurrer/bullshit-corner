import { v } from 'convex/values'

import { query } from './_generated/server'

export const listRanked = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query('entries')
      .withIndex('by_score')
      .order('desc')
      .take(args.limit ?? 50)

    return await Promise.all(
      entries.map(async (entry) => ({
        ...entry,
        episode: await ctx.db.get('episodes', entry.episodeId),
      })),
    )
  },
})
