/// <reference types="vite/client" />

import rateLimiterTest from '@convex-dev/rate-limiter/test'
import { convexTest } from 'convex-test'
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
})
