import { describe, expect, test } from 'vitest'

import { supportsAppViewTransitions } from './viewTransitions'

describe('supportsAppViewTransitions', () => {
  test.each([
    ['Firefox', 'Mozilla/5.0 Firefox/142.0'],
    ['Firefox for iOS', 'Mozilla/5.0 FxiOS/142.0 Mobile/15E148 Safari/605.1.15'],
    ['Safari', 'Mozilla/5.0 Version/26.0 Safari/605.1.15'],
    ['mobile Safari', 'Mozilla/5.0 Version/26.0 Mobile/15E148 Safari/604.1'],
  ])('falls back to normal navigation in %s', (_, userAgent) => {
    expect(
      supportsAppViewTransitions({ hasViewTransitionApi: true, userAgent }),
    ).toBe(false)
  })

  test('keeps transitions enabled in Chromium browsers that support the API', () => {
    expect(
      supportsAppViewTransitions({
        hasViewTransitionApi: true,
        userAgent: 'Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36',
      }),
    ).toBe(true)
  })

  test('falls back when the View Transitions API is unavailable', () => {
    expect(
      supportsAppViewTransitions({
        hasViewTransitionApi: false,
        userAgent: 'Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36',
      }),
    ).toBe(false)
  })
})
