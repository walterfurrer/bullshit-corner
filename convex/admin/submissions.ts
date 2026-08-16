import { paginationOptsValidator } from 'convex/server'
import { ConvexError, v } from 'convex/values'

import { mutation, query } from '../_generated/server'
import { requireAdmin } from '../lib/auth'

/**
 * Paginated list of unchosen submissions, ordered desc by submittedAt.
 *
 * Uses the `by_submittedAt` index with a post-filter for `isChosen !== true`
 * because existing submissions may have `isChosen` as `undefined` (not indexed
 * under `eq('isChosen', false)`).
 */
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    return ctx.db
      .query('submissions')
      .withIndex('by_submittedAt')
      .filter((q) => q.neq(q.field('isChosen'), true))
      .order('desc')
      .paginate(args.paginationOpts)
  },
})

/**
 * Paginated list of chosen submissions, ordered desc by submittedAt.
 *
 * Uses the `by_isChosen_and_submittedAt` compound index since chosen
 * submissions explicitly have `isChosen: true`.
 */
export const listChosen = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    return ctx.db
      .query('submissions')
      .withIndex('by_isChosen_and_submittedAt', (q) => q.eq('isChosen', true))
      .order('desc')
      .paginate(args.paginationOpts)
  },
})

/**
 * Mark a submission as "chosen" — sets `chosenAt`, `chosenBy`, and
 * `isChosen: true`. Idempotent: if already chosen, returns early.
 */
export const markChosen = mutation({
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

    // Idempotent: if already chosen, do nothing
    if (submission.isChosen === true) return

    // Look up the admin's user record for the audit trail
    const user = await ctx.db
      .query('users')
      .withIndex('by_tokenIdentifier', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier),
      )
      .unique()

    await ctx.db.patch(args.id, {
      chosenAt: Date.now(),
      chosenBy: user?._id,
      isChosen: true,
    })
  },
})

/**
 * Remove the "chosen" status from a submission — clears `chosenAt`,
 * `chosenBy`, and sets `isChosen: false`. Idempotent: if not currently
 * chosen, returns early.
 */
export const unmarkChosen = mutation({
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

    // Idempotent: if not chosen, do nothing
    if (submission.isChosen !== true) return

    await ctx.db.patch(args.id, {
      chosenAt: undefined,
      chosenBy: undefined,
      isChosen: false,
    })
  },
})
