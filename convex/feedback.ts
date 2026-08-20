import { ConvexError, v } from 'convex/values'

import { env, mutation } from './_generated/server'
import { getOrCreateUserId } from './users'
import {
  FEEDBACK_MESSAGE_MAX_LENGTH,
  FEEDBACK_PAGE_PATH_MAX_LENGTH,
} from '../shared/constants'

export const feedbackCategoryValidator = v.union(
  v.literal('bug'),
  v.literal('idea'),
  v.literal('general'),
)

function requireFeedbackEnabled() {
  if (env.TEST_FEEDBACK_ENABLED !== 'true') {
    throw new ConvexError({
      code: 'FEATURE_DISABLED',
      message: 'Beta feedback is not enabled in this environment.',
    })
  }
}

function validateMessage(message: string) {
  const trimmed = message.trim()
  if (trimmed.length === 0) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Feedback message is required.',
    })
  }
  if (trimmed.length > FEEDBACK_MESSAGE_MAX_LENGTH) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: `Feedback must be ${FEEDBACK_MESSAGE_MAX_LENGTH} characters or fewer.`,
    })
  }
  return trimmed
}

function validatePagePath(pagePath: string) {
  const trimmed = pagePath.trim()
  if (!trimmed.startsWith('/') || trimmed.length > FEEDBACK_PAGE_PATH_MAX_LENGTH) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Feedback page path is invalid.',
    })
  }
  return trimmed
}

/** Submit beta-only product feedback as the authenticated user. */
export const create = mutation({
  args: {
    category: feedbackCategoryValidator,
    message: v.string(),
    pagePath: v.string(),
  },
  returns: v.id('feedback'),
  handler: async (ctx, args) => {
    requireFeedbackEnabled()

    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError({
        code: 'UNAUTHENTICATED',
        message: 'Sign in required.',
      })
    }

    const userId = await getOrCreateUserId(ctx, identity)
    return ctx.db.insert('feedback', {
      userId,
      category: args.category,
      message: validateMessage(args.message),
      pagePath: validatePagePath(args.pagePath),
      createdAt: Date.now(),
    })
  },
})
