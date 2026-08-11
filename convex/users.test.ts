/// <reference types="vite/client" />

import { convexTest } from 'convex-test'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { api } from './_generated/api'
import { DISPLAY_NAME_MAX_LENGTH } from './constants'
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


/**
 * Arbitrary that generates a Clerk-like identity object with random field values.
 */
const arbIdentity = (overrides?: { subject?: string }) =>
  fc.record({
    subject: overrides?.subject
      ? fc.constant(overrides.subject)
      : fc.uuid().map((u) => `user_${u}`),
    email: fc.emailAddress(),
    name: fc.string({ minLength: 1, maxLength: 30 }),
    pictureUrl: fc.webUrl(),
  }).map((fields) => ({
    subject: fields.subject,
    issuer: 'https://nice-sailfish-32.clerk.accounts.dev',
    tokenIdentifier: `https://nice-sailfish-32.clerk.accounts.dev|${fields.subject}`,
    email: fields.email,
    name: fields.name,
    pictureUrl: fields.pictureUrl,
  }))

describe('Property 1: New user sync initializes alwaysAnonymous to false', () => {
  /**
   * Validates: Requirements 1.2
   *
   * For any valid UserIdentity that does not correspond to an existing user,
   * calling users.sync creates a document with alwaysAnonymous === false.
   */
  test('sync always sets alwaysAnonymous to false for new users', async () => {
    await fc.assert(
      fc.asyncProperty(arbIdentity(), async (ident) => {
        const t = convexTest(schema, modules)
        const asUser = t.withIdentity(ident)

        await asUser.mutation(api.users.sync, {})

        const user = await asUser.query(api.users.getMe, {})
        expect(user).not.toBeNull()
        expect(user!.alwaysAnonymous).toBe(false)
      }),
      { numRuns: 30 },
    )
  })
})

describe('Property 2: Sync preserves alwaysAnonymous on existing users', () => {
  /**
   * Validates: Requirements 1.3
   *
   * For any existing user with any alwaysAnonymous value (true or false),
   * calling sync again does not overwrite alwaysAnonymous.
   */
  test('sync never overwrites alwaysAnonymous on update', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbIdentity(),
        fc.boolean(),
        async (ident, anonymousValue) => {
          const t = convexTest(schema, modules)
          const asUser = t.withIdentity(ident)

          // Create the user
          const userId = await asUser.mutation(api.users.sync, {})

          // Directly patch alwaysAnonymous to the random value
          await t.run(async (ctx) => {
            await ctx.db.patch(userId, { alwaysAnonymous: anonymousValue })
          })

          // Call sync again (simulating a Clerk identity refresh)
          await asUser.mutation(api.users.sync, {})

          // Verify alwaysAnonymous is unchanged
          const user = await asUser.query(api.users.getMe, {})
          expect(user!.alwaysAnonymous).toBe(anonymousValue)
        },
      ),
      { numRuns: 30 },
    )
  })
})

describe('Property 4: updateProfile round-trip preserves values', () => {
  /**
   * Validates: Requirements 3.3, 3.4, 4.2, 9.3, 10.3, 10.5
   *
   * For any valid name (1-50 non-whitespace chars after trimming) and any
   * boolean alwaysAnonymous, calling updateProfile then getMe returns
   * matching values.
   */
  test('updateProfile saves and retrieves name and alwaysAnonymous correctly', async () => {
    // Generate valid display names: 1 to 50 printable characters (no leading/trailing whitespace)
    const arbValidName = fc
      .string({ minLength: 1, maxLength: DISPLAY_NAME_MAX_LENGTH })
      .filter((s) => s.trim().length > 0 && s.trim().length <= DISPLAY_NAME_MAX_LENGTH)
      .map((s) => s.trim())

    await fc.assert(
      fc.asyncProperty(
        arbValidName,
        fc.boolean(),
        async (name, alwaysAnonymous) => {
          const t = convexTest(schema, modules)
          const asUser = t.withIdentity(identity)

          // Ensure user exists
          await asUser.mutation(api.users.sync, {})

          // Update profile
          await asUser.mutation(api.users.updateProfile, {
            name,
            alwaysAnonymous,
          })

          // Read back
          const user = await asUser.query(api.users.getMe, {})
          expect(user!.name).toBe(name)
          expect(user!.alwaysAnonymous).toBe(alwaysAnonymous)
        },
      ),
      { numRuns: 40 },
    )
  })
})

describe('Property 5: updateProfile rejects empty name unless anonymous', () => {
  /**
   * Validates: Requirements 3.5, 9.5
   *
   * For any whitespace-only string, calling updateProfile with
   * alwaysAnonymous: false rejects. With alwaysAnonymous: true it accepts.
   */
  test('rejects whitespace-only names when alwaysAnonymous is false', async () => {
    const arbWhitespace = fc
      .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 20 })
      .map((chars) => chars.join(''))

    await fc.assert(
      fc.asyncProperty(arbWhitespace, async (whitespaceStr) => {
        const t = convexTest(schema, modules)
        const asUser = t.withIdentity(identity)

        await asUser.mutation(api.users.sync, {})

        await expect(
          asUser.mutation(api.users.updateProfile, {
            name: whitespaceStr,
            alwaysAnonymous: false,
          }),
        ).rejects.toThrow('Display name cannot be empty')
      }),
      { numRuns: 20 },
    )
  })

  test('accepts whitespace-only names when alwaysAnonymous is true', async () => {
    const arbWhitespace = fc
      .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 20 })
      .map((chars) => chars.join(''))

    await fc.assert(
      fc.asyncProperty(arbWhitespace, async (whitespaceStr) => {
        const t = convexTest(schema, modules)
        const asUser = t.withIdentity(identity)

        await asUser.mutation(api.users.sync, {})

        // Should NOT throw when alwaysAnonymous is true
        await expect(
          asUser.mutation(api.users.updateProfile, {
            name: whitespaceStr,
            alwaysAnonymous: true,
          }),
        ).resolves.toBeDefined()
      }),
      { numRuns: 20 },
    )
  })
})

describe('Property 8: updateProfile rejects names exceeding 50 characters', () => {
  /**
   * Validates: Requirements 12.1, 12.2
   *
   * For any string whose trimmed length exceeds DISPLAY_NAME_MAX_LENGTH (50),
   * updateProfile rejects. Strings with trimmed length 1-50 are accepted.
   */
  test('rejects names longer than 50 characters after trimming', async () => {
    // Generate strings that are > 50 chars after trimming
    const arbLongName = fc
      .string({ minLength: DISPLAY_NAME_MAX_LENGTH + 1, maxLength: 200 })
      .filter((s) => s.trim().length > DISPLAY_NAME_MAX_LENGTH)

    await fc.assert(
      fc.asyncProperty(arbLongName, async (longName) => {
        const t = convexTest(schema, modules)
        const asUser = t.withIdentity(identity)

        await asUser.mutation(api.users.sync, {})

        await expect(
          asUser.mutation(api.users.updateProfile, { name: longName }),
        ).rejects.toThrow('50 characters or fewer')
      }),
      { numRuns: 30 },
    )
  })

  test('accepts names with trimmed length between 1 and 50 chars', async () => {
    const arbAcceptableName = fc
      .string({ minLength: 1, maxLength: DISPLAY_NAME_MAX_LENGTH })
      .filter((s) => s.trim().length >= 1 && s.trim().length <= DISPLAY_NAME_MAX_LENGTH)

    await fc.assert(
      fc.asyncProperty(arbAcceptableName, async (validName) => {
        const t = convexTest(schema, modules)
        const asUser = t.withIdentity(identity)

        await asUser.mutation(api.users.sync, {})

        await expect(
          asUser.mutation(api.users.updateProfile, { name: validName }),
        ).resolves.toBeDefined()
      }),
      { numRuns: 30 },
    )
  })
})
