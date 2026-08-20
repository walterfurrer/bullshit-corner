/**
 * Dashboard-only seed script.
 *
 * Run from the Convex dashboard (Functions → seed → Run) to populate
 * dev environment data. Clears existing data and inserts fresh seed data
 * for bullshitCornerEntries, users, and submissions.
 */
import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

// ─── Leaderboard entries ──────────────────────────────────────────────────────

const leaderboardEntries = [
  {
    title: 'Abu Dhabi 2021 — Masi\'s "Safety Car Restart" Call',
    ranking: 1,
    youtubeUrl: 'https://www.youtube.com/watch?v=FGpmfnLMRoA',
    submittedBy: 'Jake Humphrey',
  },
  {
    title: 'Ferrari Team Orders — "Fernando is faster than you"',
    ranking: 2,
    youtubeUrl: 'https://www.youtube.com/watch?v=Hs3Y0JiCKsk',
    submittedBy: 'Rob Smedley',
  },
  {
    title: 'Spa 2021 — Two Laps Behind the Safety Car = A Race',
    ranking: 3,
    submittedBy: 'Otmar Szafnauer',
  },
  {
    title: 'The 2005 US Grand Prix — 6 Cars Start',
    ranking: 4,
    youtubeUrl: 'https://www.youtube.com/watch?v=xGpXNsAHnHw',
    submittedBy: 'Walter',
  },
  {
    title: 'Spygate 2007 — McLaren\'s $100M Fine',
    ranking: 5,
    submittedBy: 'Jake Humphrey',
  },
  {
    title: 'Crashgate — Renault Orders Piquet Jr to Crash',
    ranking: 6,
    youtubeUrl: 'https://www.youtube.com/watch?v=JKQzXNIJLAA',
    submittedBy: 'Otmar Szafnauer',
  },
  {
    title: 'Max\'s 2021 Jeddah "Brake Check" Incident',
    ranking: 7,
    youtubeUrl: 'https://www.youtube.com/watch?v=cqazMrP91mY',
    submittedBy: 'Rob Smedley',
  },
  {
    title: 'Budget Cap Breach — Red Bull\'s 2021 Overspend',
    ranking: 8,
    submittedBy: 'Jake Humphrey',
  },
  {
    title: 'Flexi-Wing Drama — Every Season Since 2010',
    ranking: 9,
    submittedBy: 'Olutosin',
  },
  {
    title: 'The FIA Jewellery Ban Targeting Lewis Hamilton',
    ranking: 10,
    submittedBy: 'Walter',
  },
]

// ─── Users ────────────────────────────────────────────────────────────────────

const usersData = [
  {
    tokenIdentifier: 'https://nice-sailfish-32.clerk.accounts.dev|user_seed_admin',
    clerkId: 'user_seed_admin',
    email: 'admin@bscorner.com',
    name: 'Walter Furrer',
    alwaysAnonymous: false,
    updatedAt: Date.now(),
  },
  {
    tokenIdentifier: 'https://nice-sailfish-32.clerk.accounts.dev|user_seed_olutosin',
    clerkId: 'user_seed_olutosin',
    email: 'olutosin@bscorner.com',
    name: 'Olutosin',
    alwaysAnonymous: false,
    updatedAt: Date.now(),
  },
  {
    tokenIdentifier: 'https://nice-sailfish-32.clerk.accounts.dev|user_seed_anon',
    clerkId: 'user_seed_anon',
    email: 'anon@bscorner.com',
    name: 'Anonymous Fan',
    alwaysAnonymous: true,
    updatedAt: Date.now(),
  },
]

// ─── Submissions (generated after users are inserted) ─────────────────────────

function buildSubmissions(userIds: { admin: string; olutosin: string; anon: string }) {
  const now = Date.now()
  const day = 86_400_000

  return [
    {
      userId: userIds.admin,
      topic: 'The Monaco GP Should Be Replaced',
      details: 'The track is too narrow for modern cars. Overtaking is practically impossible. It only exists because of tradition and money.',
      youtubeUrl: 'https://www.youtube.com/watch?v=exampleMonaco',
      submittedBy: 'Walter',
      submittedAt: now - 7 * day,
    },
    {
      userId: userIds.admin,
      topic: 'Sprint Races Devalue the Main Event',
      details: 'We already have qualifying to set the grid. Sprints just add wear and risk for less reward.',
      submittedBy: 'Walter',
      submittedAt: now - 6 * day,
    },
    {
      userId: userIds.olutosin,
      topic: 'DRS Should Be Removed Entirely',
      details: 'Ground effect cars can follow more closely now. DRS creates artificial highway passes instead of real racing.',
      submittedBy: 'Olutosin',
      submittedAt: now - 5 * day,
    },
    {
      userId: userIds.olutosin,
      topic: 'Pit Lane Speed Limits Are Too Conservative',
      details: 'Teams already have limiters. Raise it from 80 to 100 km/h in the lane itself — keep the entry/exit zones the same.',
      youtubeUrl: 'https://www.youtube.com/watch?v=examplePitLane',
      submittedBy: 'Olutosin',
      submittedAt: now - 4 * day,
    },
    {
      userId: userIds.olutosin,
      topic: 'Reverse Grid Races Should Be Tried',
      details: 'Just once. Let the backmarkers start at the front for one race weekend. See what happens.',
      submittedBy: 'Olutosin',
      submittedAt: now - 3 * day,
    },
    {
      userId: userIds.anon,
      topic: 'The Points System Needs an Overhaul',
      details: 'Fastest lap point is meaningless for drivers already in the top 10. Award it to anyone who sets it regardless of position.',
      submittedAt: now - 2 * day,
    },
    {
      userId: userIds.anon,
      topic: 'Team Principal Radio Should Be Broadcast Live',
      details: 'Imagine hearing Toto and Christian in real-time during a controversial incident. Ratings would go through the roof.',
      submittedAt: now - 1 * day,
    },
    {
      userId: userIds.admin,
      topic: 'Gravel Traps Should Replace Tarmac Runoffs',
      details: 'Tarmac runoffs let drivers exceed track limits with no real penalty. Gravel punishes mistakes like it should.',
      youtubeUrl: 'https://www.youtube.com/watch?v=exampleGravel',
      submittedBy: 'Walter',
      submittedAt: now - 12 * 3_600_000,
    },
    {
      userId: userIds.olutosin,
      topic: 'The 107% Rule Should Apply to Every Session',
      details: 'Not just Q1. If you\'re that far off pace in any session, questions need to be asked.',
      submittedBy: 'Olutosin',
      submittedAt: now - 6 * 3_600_000,
    },
    {
      userId: userIds.anon,
      topic: 'Customer Teams Should Get Equal Engines',
      details: 'Spec PU modes for customers vs works teams. The performance gap between "the same" engine is suspicious.',
      submittedAt: now - 3 * 3_600_000,
    },
  ]
}

const testSubmitter = {
  tokenIdentifier: 'seed:leaderboard-promotion-testing',
  clerkId: 'seed_leaderboard_promotion_testing',
  name: 'Leaderboard Test Driver',
  alwaysAnonymous: false,
}

const testSubmissions = [
  {
    topic: 'The Safety Car Should Be Banned From Restarting Races',
    details: 'Red flags are clearer. Safety-car restarts turn every race into a random sprint.',
  },
  {
    topic: 'Every Team Should Run a Rookie in FP1 at Every Round',
    details: 'Two sessions a year is not enough to develop the next generation of drivers.',
  },
  {
    topic: 'Qualifying Tyre Rules Make No Sense',
    details: 'Let drivers use the compound that works best instead of designing strategy around arbitrary restrictions.',
  },
  {
    topic: 'Radio Coaching Should Be Limited During Races',
    details: 'Drivers should make more calls themselves instead of receiving a constant stream of instructions.',
  },
  {
    topic: 'Championship Points Should Go Down to P15',
    details: 'The current system makes most midfield races invisible in the standings.',
  },
  {
    topic: 'Track Limits Penalties Should Be Automated',
    details: 'Sensors already know when all four wheels are off track, so steward decisions should be consistent.',
  },
]

// ─── Seed mutation ────────────────────────────────────────────────────────────

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing data
    const existingEntries = await ctx.db.query('bullshitCornerEntries').collect()
    for (const entry of existingEntries) {
      await ctx.db.delete(entry._id)
    }

    const existingSubmissions = await ctx.db.query('submissions').collect()
    for (const sub of existingSubmissions) {
      await ctx.db.delete(sub._id)
    }

    const existingUsers = await ctx.db.query('users').collect()
    for (const user of existingUsers) {
      await ctx.db.delete(user._id)
    }

    // Insert users
    const adminId = await ctx.db.insert('users', usersData[0])
    const olutosinId = await ctx.db.insert('users', usersData[1])
    const anonId = await ctx.db.insert('users', usersData[2])

    // Insert leaderboard entries
    for (const entry of leaderboardEntries) {
      await ctx.db.insert('bullshitCornerEntries', entry)
    }

    // Insert submissions
    const submissions = buildSubmissions({
      admin: adminId,
      olutosin: olutosinId,
      anon: anonId,
    })

    for (const sub of submissions) {
      await ctx.db.insert('submissions', {
        userId: sub.userId as any,
        topic: sub.topic,
        details: sub.details,
        youtubeUrl: sub.youtubeUrl,
        submittedBy: sub.submittedBy,
        submittedAt: sub.submittedAt,
      })
    }
  },
})

/** Adds repeatable fixtures for testing the submission promotion flow. */
export const seedMoreSubmissions = internalMutation({
  args: {},
  returns: v.object({ inserted: v.number(), skipped: v.number() }),
  handler: async (ctx) => {
    const now = Date.now()
    let user = await ctx.db
      .query('users')
      .withIndex('by_tokenIdentifier', (q) =>
        q.eq('tokenIdentifier', testSubmitter.tokenIdentifier),
      )
      .unique()

    if (!user) {
      const userId = await ctx.db.insert('users', {
        ...testSubmitter,
        updatedAt: now,
      })
      user = await ctx.db.get(userId)
    }

    if (!user) throw new Error('Unable to create the test submitter.')

    const existingSubmissions = await ctx.db
      .query('submissions')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .take(testSubmissions.length)
    const existingTopics = new Set(existingSubmissions.map((submission) => submission.topic))
    let inserted = 0

    for (const [index, submission] of testSubmissions.entries()) {
      if (existingTopics.has(submission.topic)) continue

      await ctx.db.insert('submissions', {
        userId: user._id,
        ...submission,
        submittedBy: testSubmitter.name,
        submittedAt: now - index * 60_000,
      })
      inserted += 1
    }

    return { inserted, skipped: testSubmissions.length - inserted }
  },
})
