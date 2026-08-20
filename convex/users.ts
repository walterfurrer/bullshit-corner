import { ConvexError, v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { internalQuery } from './_generated/server'
import { DISPLAY_NAME_MAX_LENGTH } from '../shared/constants'
import { removeUserRanking } from './communityRankings'

import type { Id } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'
import type { UserIdentity } from 'convex/server'

type UserProfile = {
  tokenIdentifier: string
  clerkId: string
  email?: string
  name?: string
  imageUrl?: string
  updatedAt: number
}

function profileFromIdentity(identity: UserIdentity): UserProfile {
  const profile: UserProfile = {
    tokenIdentifier: identity.tokenIdentifier,
    clerkId: identity.subject,
    updatedAt: Date.now(),
  }

  if (identity.email !== undefined) {
    profile.email = identity.email
  }

  if (identity.name !== undefined) {
    profile.name = identity.name
  }

  if (identity.pictureUrl !== undefined) {
    profile.imageUrl = identity.pictureUrl
  }

  return profile
}

export async function getOrCreateUserId(
  ctx: MutationCtx,
  identity: UserIdentity,
): Promise<Id<'users'>> {
  const existing = await ctx.db
    .query('users')
    .withIndex('by_tokenIdentifier', (query) =>
      query.eq('tokenIdentifier', identity.tokenIdentifier),
    )
    .unique()

  const profile = profileFromIdentity(identity)

  if (existing) {
    // Patch profile fields from Clerk — never overwrite alwaysAnonymous.
    // Guard: don't blank a user-set name with a stale/empty Clerk token value.
    if (existing.name && !profile.name) {
      delete (profile as Partial<UserProfile>).name
    }
    await ctx.db.patch(existing._id, profile)
    return existing._id
  }

  // New user — initialize alwaysAnonymous to false
  return ctx.db.insert('users', { ...profile, alwaysAnonymous: false })
}

export const sync = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new ConvexError('Authentication required.')
    }

    return getOrCreateUserId(ctx, identity)
  },
})

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      return null
    }

    return ctx.db
      .query('users')
      .withIndex('by_tokenIdentifier', (query) =>
        query.eq('tokenIdentifier', identity.tokenIdentifier),
      )
      .unique()
  },
})

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    alwaysAnonymous: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError('Authentication required.')

    const user = await ctx.db
      .query('users')
      .withIndex('by_tokenIdentifier', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier),
      )
      .unique()

    if (!user) throw new ConvexError('User not found.')

    const patch: Record<string, unknown> = { updatedAt: Date.now() }

    if (args.name !== undefined) {
      const trimmed = args.name.trim()
      if (trimmed.length === 0 && args.alwaysAnonymous !== true) {
        throw new ConvexError(
          'Display name cannot be empty unless you choose to stay anonymous.',
        )
      }
      if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
        throw new ConvexError(
          `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`,
        )
      }
      patch.name = trimmed.length > 0 ? trimmed : undefined
    }

    if (args.alwaysAnonymous !== undefined) {
      patch.alwaysAnonymous = args.alwaysAnonymous
    }

    await ctx.db.patch(user._id, patch)

    // Retroactively update submittedBy on all existing submissions to match
    // the new identity preference.
    const newSubmittedBy =
      (args.alwaysAnonymous ?? user.alwaysAnonymous) === true
        ? 'Anonymous'
        : (patch.name as string | undefined) ?? user.name ?? undefined

    const submissions = await ctx.db
      .query('submissions')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()

    for (const submission of submissions) {
      if (submission.submittedBy !== newSubmittedBy) {
        await ctx.db.patch(submission._id, { submittedBy: newSubmittedBy })
      }
    }

    return user._id
  },
})

/**
 * Soft-delete: anonymizes the user's submissions and marks the user record
 * as deleted. Call this BEFORE deleting the user from Clerk so that the
 * Convex auth identity is still valid during the mutation.
 */
export const softDelete = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError('Authentication required.')

    const user = await ctx.db
      .query('users')
      .withIndex('by_tokenIdentifier', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier),
      )
      .unique()

    if (!user) throw new ConvexError('User not found.')

    await removeUserRanking(ctx, user._id)

    // Anonymize all submissions
    const submissions = await ctx.db
      .query('submissions')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()

    for (const submission of submissions) {
      await ctx.db.patch(submission._id, { submittedBy: 'Deleted User' })
    }

    // Mark user as deleted (keep the record for referential integrity)
    await ctx.db.patch(user._id, {
      deletedAt: Date.now(),
      name: undefined,
      email: undefined,
      imageUrl: undefined,
      alwaysAnonymous: undefined,
      updatedAt: Date.now(),
    })

    return user._id
  },
})


/**
 * Internal query: returns all non-deleted users who have a name and a clerkId.
 * Used by the one-time backfill action to push names to Clerk.
 */
export const listUsersWithNames = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect()
    return users
      .filter((u) => u.name && u.clerkId && !u.deletedAt)
      .map((u) => ({ clerkId: u.clerkId, name: u.name! }))
  },
})
