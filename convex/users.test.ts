/// <reference types="vite/client" />

import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'

import { api } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

const identity = {
  subject: 'user_test_123',
  issuer: 'https://nice-sailfish-32.clerk.accounts.dev',
  tokenIdentifier:
    'https://nice-sailfish-32.clerk.accounts.dev|user_test_123',
  email: 'driver@example.com',
  name: 'Test Driver',
  pictureUrl: 'https://example.com/avatar.png',
}

describe('users', () => {
  test('returns null for an unauthenticated current-user lookup', async () => {
    const t = convexTest(schema, modules)

    await expect(t.query(api.users.getMe, {})).resolves.toBeNull()
  })

  test('rejects unauthenticated synchronization', async () => {
    const t = convexTest(schema, modules)

    await expect(t.mutation(api.users.sync, {})).rejects.toThrow(
      'Authentication required.',
    )
  })

  test('inserts once and updates the same tokenIdentifier record', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(identity)

    const firstId = await asUser.mutation(api.users.sync, {})
    const secondId = await asUser.mutation(api.users.sync, {})
    const currentUser = await asUser.query(api.users.getMe, {})
    const users = await t.run((ctx) => ctx.db.query('users').take(10))

    expect(secondId).toBe(firstId)
    expect(users).toHaveLength(1)
    expect(currentUser).toMatchObject({
      _id: firstId,
      tokenIdentifier: identity.tokenIdentifier,
      clerkId: identity.subject,
      email: identity.email,
      name: identity.name,
      imageUrl: identity.pictureUrl,
    })
  })
})
