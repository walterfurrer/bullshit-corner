import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  episodes: defineTable({
    number: v.number(),
    title: v.optional(v.string()),
    airDate: v.number(),
    youtubeUrl: v.optional(v.string()),
  }).index('by_number', ['number']),

  entries: defineTable({
    episodeId: v.id('episodes'),
    title: v.string(),
    description: v.optional(v.string()),
    score: v.number(),
    timestampSeconds: v.optional(v.number()),
  }).index('by_score', ['score']),
})
