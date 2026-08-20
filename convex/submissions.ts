import { RateLimiter } from '@convex-dev/rate-limiter'
import { ConvexError, v } from 'convex/values'

import { SUBMISSION_LIMITS } from '../shared/constants'
import { isValidYouTubeUrl } from '../shared/youtubeUrl'
import { components } from './_generated/api'
import { mutation, query } from './_generated/server'
import { getOrCreateUserId } from './users'

import type { Id } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'

const TOPIC_MAX = SUBMISSION_LIMITS.topic
const ALIAS_MAX = SUBMISSION_LIMITS.alias
const DETAILS_MAX = SUBMISSION_LIMITS.details
const YOUTUBE_URL_MAX = SUBMISSION_LIMITS.youtubeUrl

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

const rateLimiter = new RateLimiter(components.rateLimiter, {
  submitTopic: { kind: 'fixed window', rate: 6, period: WEEK_MS },
})

type SubmissionFields = {
  topic: string
  details?: string
  youtubeUrl?: string
}

function normalizeSubmissionFields(args: SubmissionFields) {
  const topic = args.topic.trim()
  const details = args.details?.trim() || undefined
  const youtubeUrl = args.youtubeUrl?.trim() || undefined

  if (topic.length === 0) {
    throw new ConvexError('Topic is required.')
  }

  if (topic.length > TOPIC_MAX) {
    throw new ConvexError(
      `Topic must be ${TOPIC_MAX} characters or fewer (received ${topic.length}).`,
    )
  }

  if (details !== undefined && details.length > DETAILS_MAX) {
    throw new ConvexError(
      `Details must be ${DETAILS_MAX} characters or fewer (received ${details.length}).`,
    )
  }

  if (youtubeUrl !== undefined) {
    if (youtubeUrl.length > YOUTUBE_URL_MAX) {
      throw new ConvexError(
        `YouTube URL must be ${YOUTUBE_URL_MAX} characters or fewer (received ${youtubeUrl.length}).`,
      )
    }
    if (!isValidYouTubeUrl(youtubeUrl)) {
      throw new ConvexError(
        'Please enter a valid YouTube URL (youtube.com/watch, youtu.be, shorts, or live).',
      )
    }
  }

  return { topic, details, youtubeUrl }
}

function normalizeSubmittedBy(value: string | undefined) {
  const submittedBy = value?.trim() || undefined

  if (submittedBy !== undefined && submittedBy.length > ALIAS_MAX) {
    throw new ConvexError(
      `Name/Alias must be ${ALIAS_MAX} characters or fewer (received ${submittedBy.length}).`,
    )
  }

  return submittedBy
}

async function requireSubmissionOwner(
  ctx: MutationCtx,
  submissionId: Id<'submissions'>,
) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new ConvexError('Authentication required.')
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_tokenIdentifier', (q) =>
      q.eq('tokenIdentifier', identity.tokenIdentifier),
    )
    .unique()
  if (!user) {
    throw new ConvexError('User not found.')
  }

  const submission = await ctx.db.get(submissionId)
  if (!submission) {
    throw new ConvexError('Submission not found.')
  }
  if (submission.userId !== user._id) {
    throw new ConvexError('You can only manage your own submissions.')
  }

  return { submission, user }
}

export const submit = mutation({
  args: {
    topic: v.string(),
    details: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    submittedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new ConvexError('Sign in or create an account to submit a topic.')
    }

    const { topic, details, youtubeUrl } = normalizeSubmissionFields(args)
    const submittedBy = normalizeSubmittedBy(args.submittedBy)

    const userId = await getOrCreateUserId(ctx, identity)

    await rateLimiter.limit(ctx, 'submitTopic', {
      key: userId,
      throws: true,
    })

    // Server-side enforcement: override client value if user is always anonymous
    const user = await ctx.db.get(userId)
    const finalSubmittedBy =
      user?.alwaysAnonymous === true ? 'Anonymous' : submittedBy

    return ctx.db.insert('submissions', {
      userId,
      topic,
      details,
      youtubeUrl,
      submittedBy: finalSubmittedBy,
      submittedAt: Date.now(),
    })
  },
})

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return { submissions: [], alwaysAnonymous: false }
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_tokenIdentifier', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier),
      )
      .unique()

    if (!user) {
      return { submissions: [], alwaysAnonymous: false }
    }

    const submissions = await ctx.db
      .query('submissions')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(50)

    return { submissions, alwaysAnonymous: user.alwaysAnonymous === true }
  },
})

export const update = mutation({
  args: {
    id: v.id('submissions'),
    topic: v.string(),
    details: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    submittedBy: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user } = await requireSubmissionOwner(ctx, args.id)
    const { topic, details, youtubeUrl } = normalizeSubmissionFields(args)
    const submittedBy = normalizeSubmittedBy(args.submittedBy)
    const finalSubmittedBy = user.alwaysAnonymous === true ? 'Anonymous' : submittedBy

    await ctx.db.patch(args.id, { topic, details, youtubeUrl, submittedBy: finalSubmittedBy })
    return null
  },
})

export const remove = mutation({
  args: { id: v.id('submissions') },
  returns: v.object({ wasPromoted: v.boolean() }),
  handler: async (ctx, args) => {
    const { submission } = await requireSubmissionOwner(ctx, args.id)
    const wasPromoted = submission.promotedAt !== undefined

    if (wasPromoted) {
      const leaderboardEntry = await ctx.db
        .query('bullshitCornerEntries')
        .withIndex('by_sourceSubmissionId', (q) =>
          q.eq('sourceSubmissionId', submission._id),
        )
        .unique()

      if (leaderboardEntry) {
        await ctx.db.patch(leaderboardEntry._id, { submittedBy: 'Anonymous' })
      }
    }

    await ctx.db.delete(args.id)
    return { wasPromoted }
  },
})
