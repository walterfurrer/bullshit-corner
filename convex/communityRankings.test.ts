/// <reference types="vite/client" />

import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'

import { api } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

const firstIdentity = {
  subject: 'user_community_first',
  issuer: 'https://nice-sailfish-32.clerk.accounts.dev',
  tokenIdentifier:
    'https://nice-sailfish-32.clerk.accounts.dev|user_community_first',
  email: 'first@example.com',
}

const secondIdentity = {
  subject: 'user_community_second',
  issuer: 'https://nice-sailfish-32.clerk.accounts.dev',
  tokenIdentifier:
    'https://nice-sailfish-32.clerk.accounts.dev|user_community_second',
  email: 'second@example.com',
}

const adminIdentity = {
  subject: 'user_community_admin',
  issuer: 'https://nice-sailfish-32.clerk.accounts.dev',
  tokenIdentifier:
    'https://nice-sailfish-32.clerk.accounts.dev|user_community_admin',
  metadata: { role: 'admin' },
}

function setup() {
  return convexTest(schema, modules)
}

async function addEntries(t: ReturnType<typeof setup>) {
  return t.run(async (ctx) => ({
    first: await ctx.db.insert('bullshitCornerEntries', {
      title: 'First topic',
      ranking: 1,
    }),
    second: await ctx.db.insert('bullshitCornerEntries', {
      title: 'Second topic',
      ranking: 2,
    }),
    third: await ctx.db.insert('bullshitCornerEntries', {
      title: 'Third topic',
      ranking: 3,
    }),
  }))
}

describe('community rankings', () => {
  test('rejects unauthenticated, empty, duplicate, and removed-entry ballots', async () => {
    const t = setup()
    const entries = await addEntries(t)

    await expect(t.mutation(api.communityRankings.save, { entryIds: [entries.first] }))
      .rejects.toThrow('Authentication required.')

    const asUser = t.withIdentity(firstIdentity)
    await asUser.mutation(api.users.sync, {})

    await expect(asUser.mutation(api.communityRankings.save, { entryIds: [] }))
      .rejects.toThrow('Rank at least one entry')
    await expect(
      asUser.mutation(api.communityRankings.save, {
        entryIds: [entries.first, entries.first],
      }),
    ).rejects.toThrow('only be ranked once')

    await t.run((ctx) => ctx.db.delete(entries.third))
    await expect(asUser.mutation(api.communityRankings.save, { entryIds: [entries.third] }))
      .rejects.toThrow('no longer available')
  })

  test('normalizes partial Borda ballots and orders ties by official rank', async () => {
    const t = setup()
    const entries = await addEntries(t)
    const firstUser = t.withIdentity(firstIdentity)
    const secondUser = t.withIdentity(secondIdentity)
    await firstUser.mutation(api.users.sync, {})
    await secondUser.mutation(api.users.sync, {})

    await firstUser.mutation(api.communityRankings.save, {
      entryIds: [entries.first, entries.second],
    })
    await secondUser.mutation(api.communityRankings.save, {
      entryIds: [entries.second],
    })

    const board = await t.query(api.communityRankings.list, {})
    expect(board.map((entry) => entry.id)).toEqual([
      entries.second,
      entries.first,
      entries.third,
    ])
    expect(board[0]).toMatchObject({ score: 4 / 3, rankedBy: 2 })
    expect(board[1]).toMatchObject({ score: 2 / 3, rankedBy: 1 })
    expect(board[2]).toMatchObject({ score: 0, rankedBy: 0 })
  })

  test('replacing and clearing a ballot removes its prior contribution', async () => {
    const t = setup()
    const entries = await addEntries(t)
    const asUser = t.withIdentity(firstIdentity)
    await asUser.mutation(api.users.sync, {})

    await asUser.mutation(api.communityRankings.save, {
      entryIds: [entries.first, entries.second],
    })
    await asUser.mutation(api.communityRankings.save, { entryIds: [entries.second] })

    let board = await t.query(api.communityRankings.list, {})
    expect(board.find((entry) => entry.id === entries.first)).toMatchObject({
      score: 0,
      rankedBy: 0,
    })
    expect(board.find((entry) => entry.id === entries.second)).toMatchObject({
      score: 1,
      rankedBy: 1,
    })
    expect(await asUser.query(api.communityRankings.getMine, {})).toEqual([entries.second])

    await asUser.mutation(api.communityRankings.clear, {})
    board = await t.query(api.communityRankings.list, {})
    expect(board.every((entry) => entry.score === 0 && entry.rankedBy === 0)).toBe(true)
    expect(await asUser.query(api.communityRankings.getMine, {})).toEqual([])
  })

  test('soft-deleting an account removes its ranking from the aggregate', async () => {
    const t = setup()
    const entries = await addEntries(t)
    const asUser = t.withIdentity(firstIdentity)
    await asUser.mutation(api.users.sync, {})
    await asUser.mutation(api.communityRankings.save, { entryIds: [entries.first] })

    await asUser.mutation(api.users.softDelete, {})

    const board = await t.query(api.communityRankings.list, {})
    expect(board.find((entry) => entry.id === entries.first)).toMatchObject({
      score: 0,
      rankedBy: 0,
    })
    expect(await asUser.query(api.communityRankings.getMine, {})).toEqual([])
  })

  test('removing an official entry removes it from the community board', async () => {
    const t = setup()
    const entries = await addEntries(t)
    const asUser = t.withIdentity(firstIdentity)
    await asUser.mutation(api.users.sync, {})
    await asUser.mutation(api.communityRankings.save, {
      entryIds: [entries.first, entries.second],
    })

    await t.withIdentity(adminIdentity).mutation(api.admin.topics.remove, {
      id: entries.first,
    })

    const board = await t.query(api.communityRankings.list, {})
    expect(board.map((entry) => entry.id)).not.toContain(entries.first)
    expect(board.find((entry) => entry.id === entries.second)).toMatchObject({
      score: 1 / 3,
      rankedBy: 1,
    })
  })
})
