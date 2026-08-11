import { internalMutation } from './_generated/server'

export const backfillAlwaysAnonymous = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect()
    let patched = 0
    for (const user of users) {
      if ((user as any).alwaysAnonymous === undefined) {
        await ctx.db.patch(user._id, { alwaysAnonymous: false })
        patched++
      }
    }
    return { patched, total: users.length }
  },
})
