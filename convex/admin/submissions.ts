import { paginationOptsValidator } from 'convex/server'
import { ConvexError, v } from 'convex/values'

import { mutation, query } from '../_generated/server'
import { requireAdmin } from '../lib/auth'

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Paginated list of available submissions (not promoted, not dismissed),
 * ordered desc by submittedAt.
 */
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    return ctx.db
      .query('submissions')
      .withIndex('by_submittedAt')
      .filter((q) =>
        q.and(
          q.eq(q.field('promotedAt'), undefined),
          q.eq(q.field('dismissedAt'), undefined),
        ),
      )
      .order('desc')
      .paginate(args.paginationOpts)
  },
})

/**
 * Paginated list of dismissed submissions, ordered desc by submittedAt.
 */
export const listDismissed = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    return ctx.db
      .query('submissions')
      .withIndex('by_submittedAt')
      .filter((q) => q.neq(q.field('dismissedAt'), undefined))
      .order('desc')
      .paginate(args.paginationOpts)
  },
})

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Dismiss a submission — soft-delete by setting `dismissedAt` and `dismissedBy`.
 * Idempotent: if already dismissed, returns early.
 */
export const dismiss = mutation({
  args: { id: v.id('submissions') },
  handler: async (ctx, args) => {
    const identity = await requireAdmin(ctx)

    const submission = await ctx.db.get(args.id)
    if (!submission) {
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: 'Submission not found.',
      })
    }

    // Idempotent: already dismissed
    if (submission.dismissedAt !== undefined) return

    const user = await ctx.db
      .query('users')
      .withIndex('by_tokenIdentifier', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier),
      )
      .unique()

    await ctx.db.patch(args.id, {
      dismissedAt: Date.now(),
      dismissedBy: user?._id,
    })
  },
})

/**
 * Undo a dismissal — clears `dismissedAt` and `dismissedBy`.
 * Idempotent: if not dismissed, returns early.
 */
export const undoDismiss = mutation({
  args: { id: v.id('submissions') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const submission = await ctx.db.get(args.id)
    if (!submission) {
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: 'Submission not found.',
      })
    }

    // Idempotent: not dismissed
    if (submission.dismissedAt === undefined) return

    await ctx.db.patch(args.id, {
      dismissedAt: undefined,
      dismissedBy: undefined,
    })
  },
})

/**
 * Promote a submission to the leaderboard — creates a topic at the given
 * ranking (shifting existing topics down) and marks the submission as promoted.
 */
export const promote = mutation({
  args: {
    id: v.id('submissions'),
    ranking: v.number(),
  },
  returns: v.id('bullshitCornerEntries'),
  handler: async (ctx, args) => {
    const identity = await requireAdmin(ctx)

    const submission = await ctx.db.get(args.id)
    if (!submission) {
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: 'Submission not found.',
      })
    }

    // Prevent double-promote
    if (submission.promotedAt !== undefined) {
      throw new ConvexError({
        code: 'ALREADY_PROMOTED',
        message: 'This submission has already been promoted.',
      })
    }

    // Shift existing entries at or below the target ranking down by 1
    const toShift = await ctx.db
      .query('bullshitCornerEntries')
      .withIndex('by_ranking', (q) => q.gte('ranking', args.ranking))
      .collect()

    for (const entry of toShift) {
      await ctx.db.patch(entry._id, { ranking: entry.ranking + 1 })
    }

    // Create the new entry from submission data
    const leaderboardEntryId = await ctx.db.insert('bullshitCornerEntries', {
      title: submission.topic,
      ranking: args.ranking,
      youtubeUrl: submission.youtubeUrl,
      submittedBy: submission.submittedBy,
      sourceSubmissionId: submission._id,
    })

    // Mark submission as promoted
    const user = await ctx.db
      .query('users')
      .withIndex('by_tokenIdentifier', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier),
      )
      .unique()

    await ctx.db.patch(args.id, {
      promotedAt: Date.now(),
      promotedBy: user?._id,
    })

    return leaderboardEntryId
  },
})
