import { internalMutation } from './_generated/server'

const episodesData = [
  { number: 1, title: 'Season Opener Nonsense', airDate: new Date('2026-01-07').getTime() },
  { number: 2, title: 'Pit Lane Shenanigans', airDate: new Date('2026-01-14').getTime() },
  { number: 3, title: 'Paddock Politics', airDate: new Date('2026-01-21').getTime() },
  { number: 4, title: 'Garage Gossip', airDate: new Date('2026-01-28').getTime() },
  { number: 5, title: 'Qualifying Chaos', airDate: new Date('2026-02-04').getTime() },
  { number: 6, title: 'Race Week Ramblings', airDate: new Date('2026-02-11').getTime() },
]

const entriesData = [
  {
    episodeIndex: 0,
    title: 'The Great Pit Wall Coffee Machine Conspiracy',
    description: 'A theory that espresso machine timing somehow predicts strategy calls.',
    score: 9.7,
  },
  {
    episodeIndex: 0,
    title: 'Sock Length Regulations for Mechanics',
    description: 'A full debate on whether crew sock height affects pit stop times.',
    score: 8.2,
  },
  {
    episodeIndex: 1,
    title: 'Radio Etiquette Meltdown',
    description: "Who gets to say 'copy' first on team radio, and why it matters so much.",
    score: 9.1,
  },
  {
    episodeIndex: 1,
    title: 'Tire Pressure Feud of the Century',
    description: 'Two engineers, one gauge, zero chill.',
    score: 8.8,
  },
  {
    episodeIndex: 2,
    title: 'Paddock Parking Spot Hierarchy',
    description: 'An unofficial ranking of who gets to park closest to catering.',
    score: 7.6,
  },
  {
    episodeIndex: 2,
    title: 'The Case for Scented Race Fuel',
    description: 'A surprisingly detailed pitch for pine-scented E10.',
    score: 9.9,
  },
  {
    episodeIndex: 3,
    title: 'Podium Champagne Shake Technique Rankings',
    description: 'Form, distance, and spray radius, scored like a diving event.',
    score: 8.4,
  },
  {
    episodeIndex: 3,
    title: 'Garage Playlist Democracy Crisis',
    description: 'The aux cord changed hands four times mid-session.',
    score: 6.9,
  },
  {
    episodeIndex: 4,
    title: 'Steering Wheel Button Naming Rights',
    description: 'A proposal to rename every unlabeled button after a crew member.',
    score: 7.2,
  },
  {
    episodeIndex: 4,
    title: 'The Great Team Principal Sunglasses Debate',
    description: 'Indoors. On a cloudy day. Explain yourselves.',
    score: 8.9,
  },
  {
    episodeIndex: 5,
    title: 'Pit Stop Lollipop Man Retirement Tour',
    description: 'A ceremonial send-off nobody asked for but everyone enjoyed.',
    score: 9.3,
  },
  {
    episodeIndex: 5,
    title: 'Grid Walk Interview Small Talk Rankings',
    description: 'Ranking every "so, tell me about your car" opener of the season.',
    score: 7.8,
  },
]

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('entries').take(1)
    if (existing.length > 0) {
      return
    }

    const episodeIds = []
    for (const episode of episodesData) {
      episodeIds.push(await ctx.db.insert('episodes', episode))
    }

    for (const entry of entriesData) {
      await ctx.db.insert('entries', {
        episodeId: episodeIds[entry.episodeIndex],
        title: entry.title,
        description: entry.description,
        score: entry.score,
      })
    }
  },
})
