import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

import { deriveNeedsOnboarding } from './useCurrentUser'

/**
 * **Validates: Requirements 2.1, 2.2**
 *
 * Property 3: Needs-onboarding derivation
 *
 * For any user document, `needsOnboarding` is `true` if and only if
 * `name` is empty/undefined AND `alwaysAnonymous === false`.
 * In all other cases (non-empty name OR `alwaysAnonymous === true`),
 * `needsOnboarding` is `false`.
 */
describe('deriveNeedsOnboarding — Property 3', () => {
  // Generator for a user document with varying name and alwaysAnonymous
  const userArb = fc.record({
    name: fc.oneof(
      // undefined — field not set
      fc.constant(undefined),
      // empty string
      fc.constant(''),
      // non-empty string (1–100 arbitrary characters)
      fc.string({ minLength: 1, maxLength: 100 }),
    ),
    alwaysAnonymous: fc.boolean(),
  })

  it('returns true iff name is empty/undefined AND alwaysAnonymous is false', () => {
    fc.assert(
      fc.property(userArb, (user) => {
        const result = deriveNeedsOnboarding(user)

        const nameIsEmpty = !user.name // covers undefined and ""
        const expected = nameIsEmpty && !user.alwaysAnonymous

        expect(result).toBe(expected)
      }),
      { numRuns: 1000 },
    )
  })

  it('is true for any user with empty/undefined name and alwaysAnonymous=false', () => {
    const emptyNameUserArb = fc.record({
      name: fc.oneof(fc.constant(undefined), fc.constant('')),
      alwaysAnonymous: fc.constant(false),
    })

    fc.assert(
      fc.property(emptyNameUserArb, (user) => {
        expect(deriveNeedsOnboarding(user)).toBe(true)
      }),
      { numRuns: 100 },
    )
  })

  it('is false for any user with a non-empty name (regardless of alwaysAnonymous)', () => {
    const namedUserArb = fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      alwaysAnonymous: fc.boolean(),
    })

    fc.assert(
      fc.property(namedUserArb, (user) => {
        expect(deriveNeedsOnboarding(user)).toBe(false)
      }),
      { numRuns: 500 },
    )
  })

  it('is false for any user with alwaysAnonymous=true (regardless of name)', () => {
    const anonymousUserArb = fc.record({
      name: fc.oneof(
        fc.constant(undefined),
        fc.constant(''),
        fc.string({ minLength: 1, maxLength: 100 }),
      ),
      alwaysAnonymous: fc.constant(true),
    })

    fc.assert(
      fc.property(anonymousUserArb, (user) => {
        expect(deriveNeedsOnboarding(user)).toBe(false)
      }),
      { numRuns: 500 },
    )
  })
})
