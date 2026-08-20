import { v } from 'convex/values'

import { internalMutation } from './_generated/server'

const previewEntries = [
  {
    title: 'The Monaco Grand Prix Is Better as a Qualifying Competition',
    ranking: 1,
    submittedBy: 'Beta Test Paddock',
  },
  {
    title: 'Team Radio Should Include Every Driver Complaint',
    ranking: 2,
    submittedBy: 'Beta Test Paddock',
  },
  {
    title: 'The Fastest Lap Point Should Return',
    ranking: 3,
    submittedBy: 'Beta Test Paddock',
  },
  {
    title: 'Every Race Weekend Needs One Reverse-Grid Session',
    ranking: 4,
    submittedBy: 'Beta Test Paddock',
  },
  {
    title: 'Gravel Traps Make Track Limits More Entertaining',
    ranking: 5,
    submittedBy: 'Beta Test Paddock',
  },
] as const

/**
 * Seeds a newly-created preview deployment with public, synthetic content.
 * It is deliberately idempotent so repeated beta deploys retain tester data.
 */
export const initialize = internalMutation({
  args: {},
  returns: v.object({ seeded: v.boolean() }),
  handler: async (ctx) => {
    const existingEntries = await ctx.db
      .query('bullshitCornerEntries')
      .withIndex('by_ranking')
      .take(1)

    if (existingEntries.length > 0) {
      return { seeded: false }
    }

    for (const entry of previewEntries) {
      await ctx.db.insert('bullshitCornerEntries', entry)
    }

    return { seeded: true }
  },
})
