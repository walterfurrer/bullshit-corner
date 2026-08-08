import { ConvexError, v } from 'convex/values'
import { mutation } from './_generated/server'

// Inline constants — cannot import from src/ across the Convex boundary
const TOPIC_MAX = 200
const EVIDENCE_MAX = 2000
const ALIAS_MAX = 100

export const submit = mutation({
  args: {
    topic: v.string(),
    evidence: v.optional(v.string()),
    submittedBy: v.string(),
  },
  handler: async (ctx, args) => {
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

    const id = await ctx.db.insert('submissions', {
      topic: args.topic,
      evidence: args.evidence,
      submittedBy: args.submittedBy,
      submittedAt: Date.now(),
    })

    return id
  },
})
