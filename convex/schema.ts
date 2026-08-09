import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    updatedAt: v.number(),
  }).index('by_tokenIdentifier', ['tokenIdentifier']),

  topics: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    // ranking is a whole number (1 = highest ranked); no upper bound
    ranking: v.number(),
    youtubeUrl: v.optional(v.string()),
    submittedBy: v.optional(v.string()),
  }).index('by_ranking', ['ranking']),

  submissions: defineTable({
    userId: v.id('users'),
    topic: v.string(),
    evidence: v.optional(v.string()),
    submittedBy: v.optional(v.string()),
    submittedAt: v.number(),
  })
    .index('by_submittedAt', ['submittedAt'])
    .index('by_userId', ['userId']),
})
