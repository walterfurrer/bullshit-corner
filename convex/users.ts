import { ConvexError } from 'convex/values'

import { mutation, query } from './_generated/server'

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
    await ctx.db.patch(existing._id, profile)
    return existing._id
  }

  return ctx.db.insert('users', profile)
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
