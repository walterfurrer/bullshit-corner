/// <reference types="vite/client" />

import { afterEach, describe, expect, test, vi } from 'vitest'
import { convexTest } from 'convex-test'

import { api } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

const testerIdentity = {
  subject: 'user_feedback_tester',
  issuer: 'https://beta.clerk.accounts.dev',
  tokenIdentifier: 'https://beta.clerk.accounts.dev|user_feedback_tester',
  email: 'tester@example.com',
  name: 'Test Driver',
}

const adminIdentity = {
  subject: 'user_feedback_admin',
  issuer: 'https://beta.clerk.accounts.dev',
  tokenIdentifier: 'https://beta.clerk.accounts.dev|user_feedback_admin',
  email: 'admin@example.com',
  name: 'Beta Admin',
  metadata: { role: 'admin' },
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('beta feedback', () => {
  test('rejects feedback when the environment feature flag is disabled', async () => {
    const t = convexTest(schema, modules)

    await expect(
      t.withIdentity(testerIdentity).mutation(api.feedback.create, {
        category: 'general',
        message: 'Great beta!',
        pagePath: '/feedback',
      }),
    ).rejects.toThrow('Beta feedback is not enabled')
  })

  test('requires authentication when beta feedback is enabled', async () => {
    vi.stubEnv('TEST_FEEDBACK_ENABLED', 'true')
    const t = convexTest(schema, modules)

    await expect(
      t.mutation(api.feedback.create, {
        category: 'general',
        message: 'Great beta!',
        pagePath: '/feedback',
      }),
    ).rejects.toThrow('Sign in required.')
  })

  test('stores valid feedback and lets only admins review it', async () => {
    vi.stubEnv('TEST_FEEDBACK_ENABLED', 'true')
    const t = convexTest(schema, modules)
    const asTester = t.withIdentity(testerIdentity)

    await asTester.mutation(api.feedback.create, {
      category: 'bug',
      message: '  The form loses focus on Safari.  ',
      pagePath: '/submit-topic',
    })

    await expect(asTester.query(api.admin.feedback.list, {})).rejects.toMatchObject({
      data: expect.objectContaining({ code: 'FORBIDDEN' }),
    })

    const feedback = await t.withIdentity(adminIdentity).query(
      api.admin.feedback.list,
      {},
    )

    expect(feedback).toHaveLength(1)
    expect(feedback[0]).toMatchObject({
      category: 'bug',
      message: 'The form loses focus on Safari.',
      pagePath: '/submit-topic',
      user: { name: 'Test Driver', email: 'tester@example.com' },
    })
  })

  test('rejects blank and oversized feedback messages', async () => {
    vi.stubEnv('TEST_FEEDBACK_ENABLED', 'true')
    const t = convexTest(schema, modules)
    const asTester = t.withIdentity(testerIdentity)

    await expect(
      asTester.mutation(api.feedback.create, {
        category: 'idea',
        message: '   ',
        pagePath: '/feedback',
      }),
    ).rejects.toThrow('Feedback message is required.')

    await expect(
      asTester.mutation(api.feedback.create, {
        category: 'idea',
        message: 'a'.repeat(2001),
        pagePath: '/feedback',
      }),
    ).rejects.toThrow('Feedback must be 2000 characters or fewer.')
  })
})
