import { ConvexError, v } from 'convex/values'
import { mutation } from './_generated/server'
import { components } from './_generated/api'
import { RateLimiter } from '@convex-dev/rate-limiter'

// Inline constants — cannot import from src/ across the Convex boundary
const TOPIC_MAX = 200
const EVIDENCE_MAX = 2000
const ALIAS_MAX = 100
const EMAIL_MAX = 320

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

const rateLimiter = new RateLimiter(components.rateLimiter, {
  submitTopic: { kind: 'fixed window', rate: 6, period: WEEK_MS },
})

/** Basic server-side email format check */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const submit = mutation({
  args: {
    topic: v.string(),
    evidence: v.optional(v.string()),
    email: v.string(),
    submittedBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Normalize email: trim + lowercase
    const email = args.email.trim().toLowerCase()

    if (email.length === 0) {
      throw new ConvexError('Email is required.')
    }

    if (email.length > EMAIL_MAX) {
      throw new ConvexError(
        `Email must be ${EMAIL_MAX} characters or fewer (received ${email.length}).`,
      )
    }

    if (!isValidEmail(email)) {
      throw new ConvexError('Please provide a valid email address.')
    }

    if (args.topic.length > TOPIC_MAX) {
      throw new ConvexError(
        `Topic must be ${TOPIC_MAX} characters or fewer (received ${args.topic.length}).`,
      )
    }

    if (args.evidence !== undefined && args.evidence.length > EVIDENCE_MAX) {
      throw new ConvexError(
        `Evidence must be ${EVIDENCE_MAX} characters or fewer (received ${args.evidence.length}).`,
      )
    }

    if (args.submittedBy.length > ALIAS_MAX) {
      throw new ConvexError(
        `Name/Alias must be ${ALIAS_MAX} characters or fewer (received ${args.submittedBy.length}).`,
      )
    }

    // Rate limit: max 6 submissions per email per week
    await rateLimiter.limit(ctx, 'submitTopic', { key: email, throws: true })

    const id = await ctx.db.insert('submissions', {
      topic: args.topic,
      evidence: args.evidence,
      email,
      submittedBy: args.submittedBy,
      submittedAt: Date.now(),
    })

    return id
  },
})
