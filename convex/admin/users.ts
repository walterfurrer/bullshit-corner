import { paginationOptsValidator, paginationResultValidator } from 'convex/server'
import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireAdmin } from '../lib/auth'

const userListItem = v.object({
  _id: v.id('users'),
  _creationTime: v.number(),
  email: v.optional(v.string()),
  name: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  alwaysAnonymous: v.optional(v.boolean()),
  deletedAt: v.optional(v.number()),
})

/**
 * Lists users for the admin directory. Results are paginated and ordered by
 * account creation time, except deleted users, which are ordered by deletion
 * time so the most recently removed accounts are easiest to review.
 *
 * Admin-only. The returned shape deliberately excludes authentication
 * identifiers, which are not needed by the UI.
 */
export const list = query({
  args: {
    status: v.union(
      v.literal('all'),
      v.literal('active'),
      v.literal('deleted'),
    ),
    sort: v.union(v.literal('asc'), v.literal('desc')),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(userListItem),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const users =
      args.status === 'active'
        ? ctx.db
            .query('users')
            .withIndex('by_deletedAt', (q) => q.eq('deletedAt', undefined))
            .order(args.sort)
        : args.status === 'deleted'
          ? ctx.db
              .query('users')
              .withIndex('by_deletedAt', (q) => q.gte('deletedAt', 0))
              .order(args.sort)
          : ctx.db.query('users').order(args.sort)

    const result = await users.paginate(args.paginationOpts)

    return {
      ...result,
      page: result.page.map((user) => ({
        _id: user._id,
        _creationTime: user._creationTime,
        ...(user.email !== undefined ? { email: user.email } : {}),
        ...(user.name !== undefined ? { name: user.name } : {}),
        ...(user.imageUrl !== undefined ? { imageUrl: user.imageUrl } : {}),
        ...(user.alwaysAnonymous !== undefined
          ? { alwaysAnonymous: user.alwaysAnonymous }
          : {}),
        ...(user.deletedAt !== undefined ? { deletedAt: user.deletedAt } : {}),
      })),
    }
  },
})
