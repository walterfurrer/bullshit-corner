import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  topics: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    // ranking is a whole number (1 = highest ranked); no upper bound
    ranking: v.number(),
    youtubeUrl: v.optional(v.string()),
    submittedBy: v.optional(v.string()),
  }).index('by_ranking', ['ranking']),
})
