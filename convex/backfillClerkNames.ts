"use node";

import { createClerkClient } from '@clerk/backend'

import { internalAction } from './_generated/server'
import { internal } from './_generated/api'

/**
 * One-time backfill: pushes display names from the Convex users table to
 * Clerk's firstName field for all existing users who have a name set.
 *
 * Run from the Convex dashboard:
 *   Functions → backfillClerkNames:run → click "Run"
 *
 * Safe to run multiple times — it only sets firstName when Clerk's value is
 * currently empty.
 */
export const run = internalAction({
  args: {},
  handler: async (ctx): Promise<string> => {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY
    if (!clerkSecretKey) {
      throw new Error('CLERK_SECRET_KEY environment variable is not set in Convex.')
    }

    const clerk = createClerkClient({ secretKey: clerkSecretKey })

    const users: Array<{ clerkId: string; name: string }> = await ctx.runQuery(
      internal.users.listUsersWithNames,
      {},
    )

    let updated = 0
    let skipped = 0
    const errors: string[] = []

    for (const { clerkId, name } of users) {
      try {
        // Fetch current Clerk user to check if firstName is already set
        const clerkUser = await clerk.users.getUser(clerkId)

        if (clerkUser.firstName) {
          // Already has a name in Clerk — don't overwrite
          skipped++
          continue
        }

        await clerk.users.updateUser(clerkId, { firstName: name })
        updated++
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        errors.push(`${clerkId}: ${message}`)
      }
    }

    const summary = `Backfill complete. Updated: ${updated}, Skipped (already had name): ${skipped}, Errors: ${errors.length}`
    if (errors.length > 0) {
      console.warn('Backfill errors:', errors)
    }
    console.log(summary)
    return summary
  },
})
