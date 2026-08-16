/// <reference types="vite/client" />

import { convexTest } from 'convex-test'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import schema from '../schema'

const modules = import.meta.glob('../**/*.ts')

const baseIdentity = {
  subject: 'user_admin_test_123',
  issuer: 'https://nice-sailfish-32.clerk.accounts.dev',
  tokenIdentifier:
    'https://nice-sailfish-32.clerk.accounts.dev|user_admin_test_123',
  email: 'admin-test@example.com',
}

/**
 * Property 1: Unauthenticated callers cannot execute admin functions
 * Validates: Requirements 3.1, 3.2
 *
 * For any Convex function guarded by requireAdmin(), if the caller has no valid
 * authentication token (i.e., ctx.auth.getUserIdentity() returns null), the
 * function SHALL throw a ConvexError with code "UNAUTHENTICATED".
 */
describe('Property 1: Unauthenticated callers cannot execute admin functions', () => {
  test('requireAdmin throws UNAUTHENTICATED when no identity is present', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary "noise" values to ensure the test is truly property-based
        // (the unauthenticated case is identity-independent, but we vary timing/invocation)
        fc.integer({ min: 1, max: 1000 }),
        async (_noise) => {
          const t = convexTest(schema, modules)

          // No withIdentity → unauthenticated caller
          await expect(
            t.run(async (ctx) => {
              const { requireAdmin } = await import('./auth')
              return requireAdmin(ctx)
            }),
          ).rejects.toMatchObject({
            data: expect.objectContaining({ code: 'UNAUTHENTICATED' }),
          })
        },
      ),
      { numRuns: 100 },
    )
  })
})

/**
 * Property 2: Non-admin authenticated callers cannot execute admin functions
 * Validates: Requirements 3.3, 1.3, 1.5
 *
 * For any authenticated identity whose metadata.role is not equal to "admin"
 * (including undefined, null, "general_user", or any arbitrary string), the
 * function SHALL throw a ConvexError with code "FORBIDDEN".
 */
describe('Property 2: Non-admin authenticated callers cannot execute admin functions', () => {
  test('requireAdmin throws FORBIDDEN for any role that is not "admin"', async () => {
    // Generate arbitrary role values that are NOT "admin"
    const nonAdminRole = fc.oneof(
      // undefined metadata (no role claim at all)
      fc.constant(undefined),
      // null role
      fc.constant(null),
      // "general_user" explicitly
      fc.constant('general_user'),
      // Empty string
      fc.constant(''),
      // Arbitrary strings that are never "admin"
      fc
        .string({ minLength: 0, maxLength: 50 })
        .filter((s) => s !== 'admin'),
      // Numbers coerced to string
      fc.integer().map(String),
      // Common role-like strings
      fc.constantFrom(
        'Admin',
        'ADMIN',
        'moderator',
        'superuser',
        'root',
        'user',
        'viewer',
        'editor',
        'admin ',
        ' admin',
      ),
    )

    await fc.assert(
      fc.asyncProperty(nonAdminRole, async (role) => {
        const t = convexTest(schema, modules)

        // Build identity with the generated role value
        const identityWithRole =
          role === undefined
            ? { ...baseIdentity } // no metadata at all
            : { ...baseIdentity, metadata: { role } }

        const asUser = t.withIdentity(identityWithRole)

        await expect(
          asUser.run(async (ctx) => {
            const { requireAdmin } = await import('./auth')
            return requireAdmin(ctx)
          }),
        ).rejects.toMatchObject({
          data: expect.objectContaining({ code: 'FORBIDDEN' }),
        })
      }),
      { numRuns: 100 },
    )
  })
})

/**
 * Property 3: Admin callers pass the guard and execute the function body
 * Validates: Requirements 3.1, 1.4
 *
 * For any authenticated identity whose metadata.role equals "admin", the
 * function SHALL NOT throw an authorization error and SHALL return the identity.
 */
describe('Property 3: Admin callers pass the guard and execute the function body', () => {
  test('requireAdmin returns the identity when metadata.role === "admin"', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate varied identity fields to prove the guard only checks role
        fc.record({
          subject: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.emailAddress(),
        }),
        async ({ subject, email }) => {
          const t = convexTest(schema, modules)

          const adminIdentity = {
            subject,
            issuer: 'https://nice-sailfish-32.clerk.accounts.dev',
            tokenIdentifier: `https://nice-sailfish-32.clerk.accounts.dev|${subject}`,
            email,
            metadata: { role: 'admin' },
          }

          const asAdmin = t.withIdentity(adminIdentity)

          const result = await asAdmin.run(async (ctx) => {
            const { requireAdmin } = await import('./auth')
            return requireAdmin(ctx)
          })

          // requireAdmin should return the identity (non-null)
          expect(result).not.toBeNull()
          expect(result).toHaveProperty('tokenIdentifier')
        },
      ),
      { numRuns: 100 },
    )
  })
})
