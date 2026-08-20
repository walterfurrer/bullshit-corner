/// <reference types="vite/client" />

import rateLimiterTest from '@convex-dev/rate-limiter/test'
import { convexTest } from 'convex-test'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { api } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

const identity = {
  subject: 'user_submitter_123',
  issuer: 'https://nice-sailfish-32.clerk.accounts.dev',
  tokenIdentifier:
    'https://nice-sailfish-32.clerk.accounts.dev|user_submitter_123',
  email: 'submitter@example.com',
}

function setup() {
  const t = convexTest(schema, modules)
  rateLimiterTest.register(t)
  return t
}

describe('submissions', () => {
  test('rejects an unauthenticated submission', async () => {
    const t = setup()

    await expect(
      t.mutation(api.submissions.submit, {
        topic: 'A suspiciously convenient safety car',
      }),
    ).rejects.toThrow('Sign in or create an account')
  })

  test('creates and owns the user on the first authenticated submission', async () => {
    const t = setup()
    const asUser = t.withIdentity(identity)

    const submissionId = await asUser.mutation(api.submissions.submit, {
      topic: '  Team radio over-analysis  ',
      submittedBy: '  Paddock Sleuth  ',
    })

    const submission = await t.run((ctx) =>
      ctx.db.get('submissions', submissionId),
    )
    const user = await t.run((ctx) =>
      ctx.db
        .query('users')
        .withIndex('by_tokenIdentifier', (query) =>
          query.eq('tokenIdentifier', identity.tokenIdentifier),
        )
        .unique(),
    )

    expect(user).not.toBeNull()
    expect(submission).toMatchObject({
      userId: user?._id,
      topic: 'Team radio over-analysis',
      submittedBy: 'Paddock Sleuth',
    })
    expect(submission).not.toHaveProperty('email')
  })

  test('stores a blank alias as absent', async () => {
    const t = setup()
    const asUser = t.withIdentity(identity)

    const submissionId = await asUser.mutation(api.submissions.submit, {
      topic: 'Mandatory team-principal karaoke',
      submittedBy: '   ',
    })
    const submission = await t.run((ctx) =>
      ctx.db.get('submissions', submissionId),
    )

    expect(submission?.submittedBy).toBeUndefined()
  })

  test('limits each authenticated user to six submissions per week', async () => {
    const t = setup()
    const asUser = t.withIdentity(identity)

    for (let index = 0; index < 6; index += 1) {
      await asUser.mutation(api.submissions.submit, {
        topic: `Rate-limited topic ${index + 1}`,
      })
    }

    await expect(
      asUser.mutation(api.submissions.submit, {
        topic: 'One submission too many',
      }),
    ).rejects.toMatchObject({
      data: expect.objectContaining({ kind: 'RateLimited' }),
    })
  })

  test('lets an owner update their submission but rejects another user', async () => {
    const t = setup()
    const asUser = t.withIdentity(identity)
    const otherIdentity = {
      ...identity,
      subject: 'user_submitter_456',
      tokenIdentifier: 'https://nice-sailfish-32.clerk.accounts.dev|user_submitter_456',
    }
    const asOtherUser = t.withIdentity(otherIdentity)
    const submissionId = await asUser.mutation(api.submissions.submit, {
      topic: 'Original take',
    })

    await asUser.mutation(api.submissions.update, {
      id: submissionId,
      topic: '  Updated take  ',
      details: '  More detail  ',
      youtubeUrl: 'https://youtu.be/example',
      submittedBy: '  Updated alias  ',
    })

    await asOtherUser.mutation(api.users.sync, {})
    await expect(
      asOtherUser.mutation(api.submissions.update, {
        id: submissionId,
        topic: 'Someone else’s take',
      }),
    ).rejects.toThrow('only manage your own submissions')

    const submission = await t.run((ctx) => ctx.db.get('submissions', submissionId))
    expect(submission).toMatchObject({
      topic: 'Updated take',
      details: 'More detail',
      youtubeUrl: 'https://youtu.be/example',
      submittedBy: 'Updated alias',
    })
  })

  test('lets an owner make an individual submission anonymous', async () => {
    const t = setup()
    const asUser = t.withIdentity(identity)
    const submissionId = await asUser.mutation(api.submissions.submit, {
      topic: 'Identity change',
      submittedBy: 'Paddock Sleuth',
    })

    await asUser.mutation(api.submissions.update, {
      id: submissionId,
      topic: 'Identity change',
      submittedBy: '   ',
    })

    const submission = await t.run((ctx) => ctx.db.get('submissions', submissionId))
    expect(submission?.submittedBy).toBeUndefined()
  })

  test('deleting a promoted submission keeps and anonymizes its leaderboard entry', async () => {
    const t = setup()
    const asUser = t.withIdentity(identity)
    const submissionId = await asUser.mutation(api.submissions.submit, {
      topic: 'Safety car chaos',
      submittedBy: 'Paddock Sleuth',
    })

    const leaderboardEntryId = await t.run(async (ctx) => {
      await ctx.db.patch(submissionId, { promotedAt: Date.now() })
      return ctx.db.insert('bullshitCornerEntries', {
        title: 'Safety car chaos',
        ranking: 1,
        submittedBy: 'Paddock Sleuth',
        sourceSubmissionId: submissionId,
      })
    })

    await expect(asUser.mutation(api.submissions.remove, { id: submissionId })).resolves.toEqual({
      wasPromoted: true,
    })

    const [submission, leaderboardEntry] = await t.run(async (ctx) => [
      await ctx.db.get('submissions', submissionId),
      await ctx.db.get('bullshitCornerEntries', leaderboardEntryId),
    ])
    expect(submission).toBeNull()
    expect(leaderboardEntry?.submittedBy).toBe('Anonymous')
  })
})

/**
 * Property 7: Backend anonymity enforcement on submission
 * Validates: Requirements 8.1, 8.2
 *
 * For any submission where the submitting user has alwaysAnonymous === true,
 * regardless of the submittedBy value provided by the client, the persisted
 * submission document SHALL have submittedBy === "Anonymous".
 * Conversely, for any submission where alwaysAnonymous === false, the persisted
 * submittedBy SHALL equal the client-provided value (trimmed, or undefined if empty).
 */
describe('Property 7: Backend anonymity enforcement on submission', () => {
  const baseIdentity = {
    subject: 'user_anon_prop_123',
    issuer: 'https://nice-sailfish-32.clerk.accounts.dev',
    tokenIdentifier:
      'https://nice-sailfish-32.clerk.accounts.dev|user_anon_prop_123',
    email: 'anonprop@example.com',
  }

  test('alwaysAnonymous === true forces submittedBy to "Anonymous" regardless of client input', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (clientAlias) => {
          const t = setup()
          const asUser = t.withIdentity(baseIdentity)

          // Create the user via sync
          await asUser.mutation(api.users.sync, {})

          // Patch alwaysAnonymous to true directly
          await t.run(async (ctx) => {
            const user = await ctx.db
              .query('users')
              .withIndex('by_tokenIdentifier', (q) =>
                q.eq('tokenIdentifier', baseIdentity.tokenIdentifier),
              )
              .unique()
            if (user) {
              await ctx.db.patch(user._id, { alwaysAnonymous: true })
            }
          })

          // Submit with the generated alias
          const submissionId = await asUser.mutation(api.submissions.submit, {
            topic: 'Property test topic',
            submittedBy: clientAlias,
          })

          // Read back and verify server enforced "Anonymous"
          const submission = await t.run((ctx) =>
            ctx.db.get('submissions', submissionId),
          )

          expect(submission?.submittedBy).toBe('Anonymous')

          await asUser.mutation(api.submissions.update, {
            id: submissionId,
            topic: 'Updated property test topic',
            submittedBy: clientAlias,
          })

          const updatedSubmission = await t.run((ctx) =>
            ctx.db.get('submissions', submissionId),
          )
          expect(updatedSubmission?.submittedBy).toBe('Anonymous')
        },
      ),
      { numRuns: 25 },
    )
  })

  test('alwaysAnonymous === false preserves client-provided submittedBy (trimmed, or undefined if empty)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Non-empty strings (with possible leading/trailing whitespace)
          fc.string({ minLength: 1, maxLength: 100 }),
          // Whitespace-only strings (should result in undefined)
          fc
            .array(fc.constantFrom(' ', '\t', '\n'), {
              minLength: 1,
              maxLength: 10,
            })
            .map((chars) => chars.join('')),
        ),
        async (clientAlias) => {
          const t = setup()
          const asUser = t.withIdentity(baseIdentity)

          // Create the user via sync (starts with alwaysAnonymous: false)
          await asUser.mutation(api.users.sync, {})

          // Submit with the generated alias
          const submissionId = await asUser.mutation(api.submissions.submit, {
            topic: 'Property test topic',
            submittedBy: clientAlias,
          })

          // Read back and verify
          const submission = await t.run((ctx) =>
            ctx.db.get('submissions', submissionId),
          )

          const trimmed = clientAlias.trim()
          const expected = trimmed.length > 0 ? trimmed : undefined

          expect(submission?.submittedBy).toBe(expected)
        },
      ),
      { numRuns: 25 },
    )
  })
})
