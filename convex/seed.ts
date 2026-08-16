/**
 * Dashboard-only seed script.
 *
 * Run from the Convex dashboard (Functions → seed → Run) to populate
 * initial topic data. Skips insertion if topics already exist.
 */
import { internalMutation } from './_generated/server'

const topicsData = [
  {
    title: 'The Case for Scented Race Fuel',
    description: 'A surprisingly detailed pitch for pine-scented E10.',
    ranking: 1,
  },
  {
    title: 'The Great Pit Wall Coffee Machine Conspiracy',
    description: 'A theory that espresso machine timing somehow predicts strategy calls.',
    ranking: 2,
  },
  {
    title: 'Radio Etiquette Meltdown',
    description: "Who gets to say 'copy' first on team radio, and why it matters so much.",
    ranking: 3,
  },
  {
    title: 'Tire Pressure Feud of the Century',
    description: 'Two engineers, one gauge, zero chill.',
    ranking: 4,
  },
  {
    title: 'Pit Stop Lollipop Man Retirement Tour',
    description: 'A ceremonial send-off nobody asked for but everyone enjoyed.',
    ranking: 5,
  },
  {
    title: 'The Great Team Principal Sunglasses Debate',
    description: 'Indoors. On a cloudy day. Explain yourselves.',
    ranking: 6,
  },
  {
    title: 'Podium Champagne Shake Technique Rankings',
    description: 'Form, distance, and spray radius, scored like a diving event.',
    ranking: 7,
  },
  {
    title: 'Sock Length Regulations for Mechanics',
    description: 'A full debate on whether crew sock height affects pit stop times.',
    ranking: 8,
  },
  {
    title: 'Grid Walk Interview Small Talk Rankings',
    description: 'Ranking every "so, tell me about your car" opener of the season.',
    ranking: 9,
  },
  {
    title: 'Paddock Parking Spot Hierarchy',
    description: 'An unofficial ranking of who gets to park closest to catering.',
    ranking: 10,
  },
  {
    title: 'Steering Wheel Button Naming Rights',
    description: 'A proposal to rename every unlabeled button after a crew member.',
    ranking: 11,
  },
  {
    title: 'Garage Playlist Democracy Crisis',
    description: 'The aux cord changed hands four times mid-session.',
    ranking: 12,
  },
]

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('topics').take(1)
    if (existing.length > 0) {
      return
    }

    for (const topic of topicsData) {
      await ctx.db.insert('topics', topic)
    }
  },
})
