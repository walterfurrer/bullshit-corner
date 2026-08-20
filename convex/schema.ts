import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({

  users: defineTable({
    tokenIdentifier: v.string(),
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    alwaysAnonymous: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    updatedAt: v.number(),
  }).index('by_tokenIdentifier', ['tokenIdentifier']),

  bullshitCornerEntries: defineTable({
    title: v.string(),
    // ranking is a whole number (1 = highest ranked); no upper bound
    ranking: v.number(),
    youtubeUrl: v.optional(v.string()),
    submittedBy: v.optional(v.string()),
  }).index('by_ranking', ['ranking']),

  communityRankings: defineTable({
    userId: v.id('users'),
    entryIds: v.array(v.id('bullshitCornerEntries')),
    updatedAt: v.number(),
  }).index('by_userId', ['userId']),

  communityEntryStats: defineTable({
    entryId: v.id('bullshitCornerEntries'),
    score: v.number(),
    rankedBy: v.number(),
  }).index('by_entryId', ['entryId']),

  submissions: defineTable({
    userId: v.id('users'),
    topic: v.string(),
    details: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    submittedBy: v.optional(v.string()),
    submittedAt: v.number(),
    // Admin review: promote to leaderboard
    promotedAt: v.optional(v.number()),
    promotedBy: v.optional(v.id('users')),
    // Admin review: dismiss/hide from queue
    dismissedAt: v.optional(v.number()),
    dismissedBy: v.optional(v.id('users')),
  })
    .index('by_submittedAt', ['submittedAt'])
    .index('by_userId', ['userId']),
})
