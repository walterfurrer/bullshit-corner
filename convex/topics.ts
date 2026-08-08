import { v } from 'convex/values'

import { internalMutation, query } from './_generated/server'

// ─── Query ────────────────────────────────────────────────────────────────────

export const listRanked = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return ctx.db
      .query('topics')
      .withIndex('by_ranking')
      .order('asc')
      .take(args.limit ?? 50)
  },
})

// ─── Create ───────────────────────────────────────────────────────────────────

export const create = internalMutation({
  args: {
    title: v.string(),
    ranking: v.number(),
    description: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    submittedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('topics', args)
  },
})

// ─── Update ───────────────────────────────────────────────────────────────────

export const update = internalMutation({
  args: {
    id: v.id('topics'),
    title: v.optional(v.string()),
    ranking: v.optional(v.number()),
    description: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    submittedBy: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    // Only patch fields that were actually provided — omit undefined values
    // so we don't accidentally clear existing data
    const patch = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined),
    )
    await ctx.db.patch(id, patch)
  },
})

// ─── Remove ───────────────────────────────────────────────────────────────────

export const remove = internalMutation({
  args: {
    id: v.id('topics'),
  },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id)
  },
})
