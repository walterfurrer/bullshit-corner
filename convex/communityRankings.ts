import { ConvexError, v } from 'convex/values'

import { mutation, query } from './_generated/server'

import type { Id } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'

const MAX_COMMUNITY_ENTRIES = 50

type EntryId = Id<'bullshitCornerEntries'>

/**
 * Normalized Borda score for a ranked entry. Scores within one ballot add up
 * to one, so partial ballots and full ballots have equal overall weight.
 */
export function normalizedBordaScore(size: number, position: number): number {
  return (2 * (size - position + 1)) / (size * (size + 1))
}

async function getCurrentEntries(ctx: MutationCtx) {
  return ctx.db
    .query('bullshitCornerEntries')
    .withIndex('by_ranking')
    .order('asc')
    .take(MAX_COMMUNITY_ENTRIES)
}

async function getActiveUserId(ctx: MutationCtx): Promise<Id<'users'>> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new ConvexError('Authentication required.')

  const user = await ctx.db
    .query('users')
    .withIndex('by_tokenIdentifier', (q) =>
      q.eq('tokenIdentifier', identity.tokenIdentifier),
    )
    .unique()

  if (!user || user.deletedAt) {
    throw new ConvexError('An active account is required to rank entries.')
  }

  return user._id
}

async function updateEntryStats(
  ctx: MutationCtx,
  entryIds: EntryId[],
  direction: 1 | -1,
) {
  for (const [index, entryId] of entryIds.entries()) {
    const scoreDelta = direction * normalizedBordaScore(entryIds.length, index + 1)
    const stats = await ctx.db
      .query('communityEntryStats')
      .withIndex('by_entryId', (q) => q.eq('entryId', entryId))
      .unique()

    if (stats) {
      await ctx.db.patch(stats._id, {
        score: stats.score + scoreDelta,
        rankedBy: stats.rankedBy + direction,
      })
    } else if (direction === 1) {
      await ctx.db.insert('communityEntryStats', {
        entryId,
        score: scoreDelta,
        rankedBy: 1,
      })
    }
  }
}

/** Removes a user's ballot and its aggregate contribution in the same transaction. */
export async function removeUserRanking(ctx: MutationCtx, userId: Id<'users'>) {
  const ranking = await ctx.db
    .query('communityRankings')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .unique()

  if (!ranking) return

  if (ranking.entryIds.length > 0) {
    // Keep the original ballot intact so every remaining entry is debited
    // using the same normalized Borda score it received when saved. Deleted
    // entries have no stat row and are therefore skipped by updateEntryStats.
    await updateEntryStats(ctx, ranking.entryIds, -1)
  }
  await ctx.db.delete(ranking._id)
}

/** Removes the aggregate row for an official entry that has been deleted. */
export async function removeEntryStats(ctx: MutationCtx, entryId: EntryId) {
  const stats = await ctx.db
    .query('communityEntryStats')
    .withIndex('by_entryId', (q) => q.eq('entryId', entryId))
    .unique()

  if (stats) await ctx.db.delete(stats._id)
}

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.id('bullshitCornerEntries'),
      title: v.string(),
      officialRanking: v.number(),
      youtubeUrl: v.optional(v.string()),
      submittedBy: v.optional(v.string()),
      score: v.number(),
      rankedBy: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const entries = await ctx.db
      .query('bullshitCornerEntries')
      .withIndex('by_ranking')
      .order('asc')
      .take(MAX_COMMUNITY_ENTRIES)
    const statsByEntryId = new Map(
      await Promise.all(
        entries.map(async (entry) =>
          [
            entry._id,
            await ctx.db
              .query('communityEntryStats')
              .withIndex('by_entryId', (q) => q.eq('entryId', entry._id))
              .unique(),
          ] as const,
        ),
      ),
    )

    return [...entries
      .map((entry) => {
        const stat = statsByEntryId.get(entry._id)
        return {
          id: entry._id,
          title: entry.title,
          officialRanking: entry.ranking,
          youtubeUrl: entry.youtubeUrl,
          submittedBy: entry.submittedBy,
          score: stat?.score ?? 0,
          rankedBy: stat?.rankedBy ?? 0,
        }
      })]
      .sort(
        (left, right) =>
          right.score - left.score || left.officialRanking - right.officialRanking,
      )
  },
})

export const getMine = query({
  args: {},
  returns: v.array(v.id('bullshitCornerEntries')),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_tokenIdentifier', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier),
      )
      .unique()
    if (!user || user.deletedAt) return []

    const ranking = await ctx.db
      .query('communityRankings')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique()
    if (!ranking) return []

    const currentEntries = await ctx.db
      .query('bullshitCornerEntries')
      .withIndex('by_ranking')
      .order('asc')
      .take(MAX_COMMUNITY_ENTRIES)
    const currentEntryIds = new Set(currentEntries.map((entry) => entry._id))
    return ranking.entryIds.filter((entryId) => currentEntryIds.has(entryId))
  },
})

export const save = mutation({
  args: { entryIds: v.array(v.id('bullshitCornerEntries')) },
  returns: v.array(v.id('bullshitCornerEntries')),
  handler: async (ctx, args) => {
    const userId = await getActiveUserId(ctx)
    if (args.entryIds.length === 0) {
      throw new ConvexError('Rank at least one entry or clear your ranking.')
    }

    const currentEntries = await getCurrentEntries(ctx)
    const currentEntryIds = new Set(currentEntries.map((entry) => entry._id))
    const uniqueEntryIds = new Set(args.entryIds)

    if (uniqueEntryIds.size !== args.entryIds.length) {
      throw new ConvexError('Each entry can only be ranked once.')
    }
    if (
      args.entryIds.length > currentEntries.length ||
      args.entryIds.some((entryId) => !currentEntryIds.has(entryId))
    ) {
      throw new ConvexError('One or more ranked entries are no longer available.')
    }

    const existing = await ctx.db
      .query('communityRankings')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique()
    // Preserve the saved ballot's original length and positions while
    // subtracting it. Entries removed from the official board simply have no
    // aggregate row to update.
    const previousEntryIds = existing?.entryIds ?? []

    if (previousEntryIds.length > 0) {
      await updateEntryStats(ctx, previousEntryIds, -1)
    }
    await updateEntryStats(ctx, args.entryIds, 1)

    if (existing) {
      await ctx.db.patch(existing._id, { entryIds: args.entryIds, updatedAt: Date.now() })
    } else {
      await ctx.db.insert('communityRankings', {
        userId,
        entryIds: args.entryIds,
        updatedAt: Date.now(),
      })
    }

    return args.entryIds
  },
})

export const clear = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await getActiveUserId(ctx)
    await removeUserRanking(ctx, userId)
    return null
  },
})
