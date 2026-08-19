import { ConvexError, v } from 'convex/values'

import { mutation, query } from '../_generated/server'
import { TITLE_MAX } from '../../shared/constants'
import { requireAdmin } from '../lib/auth'

function validateTitle(title: string): string {
  const trimmed = title.trim()
  if (trimmed.length === 0) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Title is required.',
    })
  }
  if (trimmed.length > TITLE_MAX) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: `Title must be ${TITLE_MAX} characters or fewer.`,
    })
  }
  return trimmed
}

// ─── Query ────────────────────────────────────────────────────────────────────

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return ctx.db
      .query('bullshitCornerEntries')
      .withIndex('by_ranking')
      .order('asc')
      .take(500)
  },
})

// ─── Create ───────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    title: v.string(),
    ranking: v.number(),
    youtubeUrl: v.optional(v.string()),
    submittedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const title = validateTitle(args.title)

    // Shift existing topics at or below the target ranking down by 1
    const toShift = await ctx.db
      .query('bullshitCornerEntries')
      .withIndex('by_ranking', (q) => q.gte('ranking', args.ranking))
      .collect()

    for (const topic of toShift) {
      await ctx.db.patch(topic._id, { ranking: topic.ranking + 1 })
    }

    return ctx.db.insert('bullshitCornerEntries', {
      title,
      ranking: args.ranking,
      youtubeUrl: args.youtubeUrl,
      submittedBy: args.submittedBy,
    })
  },
})

// ─── Update ───────────────────────────────────────────────────────────────────

export const update = mutation({
  args: {
    id: v.id('bullshitCornerEntries'),
    title: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    submittedBy: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx)

    const existing = await ctx.db.get(id)
    if (!existing) {
      throw new ConvexError({ code: 'NOT_FOUND', message: 'Topic not found.' })
    }

    const patch: Record<string, any> = {}

    if (fields.title !== undefined) {
      patch.title = validateTitle(fields.title)
    }
    if (fields.youtubeUrl !== undefined) patch.youtubeUrl = fields.youtubeUrl
    if (fields.submittedBy !== undefined) patch.submittedBy = fields.submittedBy

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(id, patch)
    }
  },
})

// ─── Reorder ──────────────────────────────────────────────────────────────────

export const reorder = mutation({
  args: {
    id: v.id('bullshitCornerEntries'),
    newRanking: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const topic = await ctx.db.get(args.id)
    if (!topic) {
      throw new ConvexError({ code: 'NOT_FOUND', message: 'Topic not found.' })
    }

    const oldRanking = topic.ranking
    const newRanking = args.newRanking

    if (oldRanking === newRanking) return

    // Get all topics to re-rank
    const allTopics = await ctx.db
      .query('bullshitCornerEntries')
      .withIndex('by_ranking')
      .order('asc')
      .collect()

    if (oldRanking < newRanking) {
      // Moving down: shift topics in (old, new] up by 1
      for (const t of allTopics) {
        if (t._id === args.id) continue
        if (t.ranking > oldRanking && t.ranking <= newRanking) {
          await ctx.db.patch(t._id, { ranking: t.ranking - 1 })
        }
      }
    } else {
      // Moving up: shift topics in [new, old) down by 1
      for (const t of allTopics) {
        if (t._id === args.id) continue
        if (t.ranking >= newRanking && t.ranking < oldRanking) {
          await ctx.db.patch(t._id, { ranking: t.ranking + 1 })
        }
      }
    }

    await ctx.db.patch(args.id, { ranking: newRanking })
  },
})

// ─── Remove ───────────────────────────────────────────────────────────────────

export const remove = mutation({
  args: { id: v.id('bullshitCornerEntries') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const topic = await ctx.db.get(args.id)
    if (!topic) {
      throw new ConvexError({ code: 'NOT_FOUND', message: 'Topic not found.' })
    }

    // Delete the topic
    await ctx.db.delete(args.id)

    // Shift subsequent topics up to close the gap
    const subsequent = await ctx.db
      .query('bullshitCornerEntries')
      .withIndex('by_ranking', (q) => q.gt('ranking', topic.ranking))
      .collect()

    for (const t of subsequent) {
      await ctx.db.patch(t._id, { ranking: t.ranking - 1 })
    }
  },
})
