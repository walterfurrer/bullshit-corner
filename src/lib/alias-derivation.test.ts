import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

import { deriveAliasField } from './alias-derivation'

/**
 * **Validates: Requirements 6.1, 6.2, 7.1, 7.2**
 *
 * Property 6: Submission alias field derivation
 *
 * For any user document, the submission form alias field value and disabled
 * state are derived deterministically:
 * - If `alwaysAnonymous === true`: value is "Anonymous" and field is disabled.
 * - Else if `name` is non-empty: value is `user.name` and field is enabled.
 * - Else: value is empty string and field is enabled.
 */
describe('deriveAliasField — Property 6', () => {
  const userArb = fc.record({
    name: fc.oneof(
      fc.constant(undefined),
      fc.constant(''),
      fc.string({ minLength: 1, maxLength: 100 }),
    ),
    alwaysAnonymous: fc.boolean(),
  })

  it('when alwaysAnonymous is true and auth enabled + authenticated, value is "Anonymous" and disabled', () => {
    const alwaysAnonUserArb = fc.record({
      name: fc.oneof(
        fc.constant(undefined),
        fc.constant(''),
        fc.string({ minLength: 1, maxLength: 100 }),
      ),
      alwaysAnonymous: fc.constant(true),
    })

    fc.assert(
      fc.property(alwaysAnonUserArb, (user) => {
        const result = deriveAliasField(user, true, true)
        expect(result.value).toBe('Anonymous')
        expect(result.disabled).toBe(true)
      }),
      { numRuns: 500 },
    )
  })

  it('when alwaysAnonymous is false and name is non-empty, value equals user.name and disabled is false', () => {
    const namedUserArb = fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      alwaysAnonymous: fc.constant(false),
    })

    fc.assert(
      fc.property(namedUserArb, (user) => {
        const result = deriveAliasField(user, true, true)
        expect(result.value).toBe(user.name)
        expect(result.disabled).toBe(false)
      }),
      { numRuns: 500 },
    )
  })

  it('when alwaysAnonymous is false and name is empty/undefined, value is "" and disabled is false', () => {
    const emptyNameUserArb = fc.record({
      name: fc.oneof(fc.constant(undefined), fc.constant('')),
      alwaysAnonymous: fc.constant(false),
    })

    fc.assert(
      fc.property(emptyNameUserArb, (user) => {
        const result = deriveAliasField(user, true, true)
        expect(result.value).toBe('')
        expect(result.disabled).toBe(false)
      }),
      { numRuns: 100 },
    )
  })

  it('when enableAuth is false, always returns empty value and enabled regardless of user state', () => {
    fc.assert(
      fc.property(userArb, (user) => {
        const result = deriveAliasField(user, false, true)
        expect(result.value).toBe('')
        expect(result.disabled).toBe(false)
      }),
      { numRuns: 500 },
    )
  })

  it('when not authenticated, always returns empty value and enabled regardless of user state', () => {
    fc.assert(
      fc.property(userArb, (user) => {
        const result = deriveAliasField(user, true, false)
        expect(result.value).toBe('')
        expect(result.disabled).toBe(false)
      }),
      { numRuns: 500 },
    )
  })

  it('when user is null, always returns empty value and enabled', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (enableAuth, isAuthenticated) => {
        const result = deriveAliasField(null, enableAuth, isAuthenticated)
        expect(result.value).toBe('')
        expect(result.disabled).toBe(false)
      }),
      { numRuns: 100 },
    )
  })
})
