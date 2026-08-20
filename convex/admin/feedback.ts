import { v } from 'convex/values'

import { env, query } from '../_generated/server'
import { requireAdmin } from '../lib/auth'

const feedbackCategoryValidator = v.union(
  v.literal('bug'),
  v.literal('idea'),
  v.literal('general'),
)

const feedbackItemValidator = v.object({
  id: v.id('feedback'),
  category: feedbackCategoryValidator,
  message: v.string(),
  pagePath: v.string(),
  createdAt: v.number(),
  user: v.union(
    v.object({
      id: v.id('users'),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
    v.null(),
  ),
})

function requireFeedbackEnabled() {
  if (env.TEST_FEEDBACK_ENABLED !== 'true') {
    throw new Error('Beta feedback is not enabled in this environment.')
  }
}

/** Returns the most recent beta feedback with its existing submitter profile. */
export const list = query({
  args: {},
  returns: v.array(feedbackItemValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx)
    requireFeedbackEnabled()

    const feedback = await ctx.db
      .query('feedback')
      .withIndex('by_createdAt')
      .order('desc')
      .take(500)

    return Promise.all(
      feedback.map(async (item) => {
        const user = await ctx.db.get(item.userId)
        return {
          id: item._id,
          category: item.category,
          message: item.message,
          pagePath: item.pagePath,
          createdAt: item.createdAt,
          user: user
            ? {
                id: user._id,
                name: user.name,
                email: user.email,
              }
            : null,
        }
      }),
    )
  },
})
