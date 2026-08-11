import { RateLimiter } from '@convex-dev/rate-limiter'
import { ConvexError, v } from 'convex/values'

import { components } from './_generated/api'
import { mutation, query } from './_generated/server'
import { getOrCreateUserId } from './users'

// Inline constants — cannot import from src/ across the Convex boundary
const TOPIC_MAX = 200
const EVIDENCE_MAX = 2000
const ALIAS_MAX = 100

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

const rateLimiter = new RateLimiter(components.rateLimiter, {
  submitTopic: { kind: 'fixed window', rate: 6, period: WEEK_MS },
})

export const submit = mutation({
  args: {
    topic: v.string(),
    evidence: v.optional(v.string()),
    submittedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new ConvexError('Sign in or create an account to submit a topic.')
    }

    const topic = args.topic.trim()
    const evidence = args.evidence?.trim() || undefined
    const submittedBy = args.submittedBy?.trim() || undefined

    if (topic.length === 0) {
      throw new ConvexError('Topic is required.')
    }

    if (topic.length > TOPIC_MAX) {
      throw new ConvexError(
        `Topic must be ${TOPIC_MAX} characters or fewer (received ${topic.length}).`,
      )
    }

    if (evidence !== undefined && evidence.length > EVIDENCE_MAX) {
      throw new ConvexError(
        `Evidence must be ${EVIDENCE_MAX} characters or fewer (received ${evidence.length}).`,
      )
    }

    if (submittedBy !== undefined && submittedBy.length > ALIAS_MAX) {
      throw new ConvexError(
        `Name/Alias must be ${ALIAS_MAX} characters or fewer (received ${submittedBy.length}).`,
      )
    }

    const userId = await getOrCreateUserId(ctx, identity)

    await rateLimiter.limit(ctx, 'submitTopic', {
      key: userId,
      throws: true,
    })

    return ctx.db.insert('submissions', {
      userId,
      topic,
      evidence,
      submittedBy,
      submittedAt: Date.now(),
    })
  },
})

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_tokenIdentifier', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier),
      )
      .unique()

    if (!user) {
      return []
    }

    return ctx.db
      .query('submissions')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(50)
  },
})
