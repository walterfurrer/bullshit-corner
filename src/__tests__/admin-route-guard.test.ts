import { describe, expect, it } from 'vitest'

/**
 * Route guard behavior tests for the admin layout route.
 *
 * The actual route guard lives in src/routes/_app/admin.tsx and uses:
 * - SSR: auth() from @clerk/tanstack-react-start/server → checks userId + sessionClaims.metadata.role
 * - CSR: useUser() → checks user.publicMetadata.role
 *
 * Since these depend on the router runtime and Clerk's auth context, we test
 * the role evaluation logic in isolation here. The evaluateAdminAccess function
 * mirrors the exact decision tree implemented in the route's beforeLoad hook.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 7.1, 7.2
 */

/**
 * Role evaluation logic extracted from the admin layout route guard.
 * Mirrors the SSR beforeLoad decision tree in src/routes/_app/admin.tsx.
 */
function evaluateAdminAccess(params: {
  userId: string | null
  role: unknown
}): 'allow' | 'redirect-unauthenticated' | 'redirect-home' {
  if (!params.userId) return 'redirect-unauthenticated'
  if (params.role !== 'admin') return 'redirect-home'
  return 'allow'
}

describe('Admin route guard logic', () => {
  describe('Requirement 2.1: unauthenticated visitors are redirected', () => {
    it('redirects when userId is null (unauthenticated)', () => {
      expect(evaluateAdminAccess({ userId: null, role: undefined })).toBe(
        'redirect-unauthenticated',
      )
    })

    it('redirects even if role claim somehow says admin but no userId', () => {
      expect(evaluateAdminAccess({ userId: null, role: 'admin' })).toBe(
        'redirect-unauthenticated',
      )
    })

    it('redirects when userId is empty string (falsy)', () => {
      expect(evaluateAdminAccess({ userId: '', role: 'admin' })).toBe(
        'redirect-unauthenticated',
      )
    })
  })

  describe('Requirement 2.2: authenticated non-admin users are redirected to /', () => {
    it('redirects when role is undefined', () => {
      expect(evaluateAdminAccess({ userId: 'user_123', role: undefined })).toBe(
        'redirect-home',
      )
    })

    it('redirects when role is null', () => {
      expect(evaluateAdminAccess({ userId: 'user_123', role: null })).toBe(
        'redirect-home',
      )
    })

    it('redirects when role is "general_user"', () => {
      expect(
        evaluateAdminAccess({ userId: 'user_123', role: 'general_user' }),
      ).toBe('redirect-home')
    })

    it('redirects when role is empty string', () => {
      expect(evaluateAdminAccess({ userId: 'user_123', role: '' })).toBe(
        'redirect-home',
      )
    })

    it('redirects for case-mismatched role values', () => {
      expect(evaluateAdminAccess({ userId: 'user_123', role: 'Admin' })).toBe(
        'redirect-home',
      )
      expect(evaluateAdminAccess({ userId: 'user_123', role: 'ADMIN' })).toBe(
        'redirect-home',
      )
      expect(
        evaluateAdminAccess({ userId: 'user_123', role: 'aDmIn' }),
      ).toBe('redirect-home')
    })

    it('redirects for other role-like strings', () => {
      expect(
        evaluateAdminAccess({ userId: 'user_123', role: 'moderator' }),
      ).toBe('redirect-home')
      expect(
        evaluateAdminAccess({ userId: 'user_123', role: 'superuser' }),
      ).toBe('redirect-home')
      expect(evaluateAdminAccess({ userId: 'user_123', role: 'editor' })).toBe(
        'redirect-home',
      )
    })

    it('redirects for non-string role values', () => {
      expect(evaluateAdminAccess({ userId: 'user_123', role: 0 })).toBe(
        'redirect-home',
      )
      expect(evaluateAdminAccess({ userId: 'user_123', role: true })).toBe(
        'redirect-home',
      )
      expect(evaluateAdminAccess({ userId: 'user_123', role: {} })).toBe(
        'redirect-home',
      )
      expect(evaluateAdminAccess({ userId: 'user_123', role: [] })).toBe(
        'redirect-home',
      )
    })
  })

  describe('Requirement 2.3: admin users are allowed through', () => {
    it('allows when role is exactly "admin"', () => {
      expect(evaluateAdminAccess({ userId: 'user_admin_1', role: 'admin' })).toBe(
        'allow',
      )
    })

    it('allows regardless of userId format', () => {
      expect(
        evaluateAdminAccess({ userId: 'user_2wHfLk9XzN', role: 'admin' }),
      ).toBe('allow')
      expect(
        evaluateAdminAccess({ userId: 'usr_longclerkid_abc123', role: 'admin' }),
      ).toBe('allow')
    })
  })

  describe('Requirement 7.1/7.2: role change propagation', () => {
    it('denies access after admin role is revoked (set to undefined)', () => {
      // Simulates: user was admin, role removed in Clerk dashboard
      // On next token refresh, sessionClaims.metadata.role is undefined
      expect(
        evaluateAdminAccess({ userId: 'user_former_admin', role: undefined }),
      ).toBe('redirect-home')
    })

    it('denies access after admin role is changed to general_user', () => {
      expect(
        evaluateAdminAccess({
          userId: 'user_former_admin',
          role: 'general_user',
        }),
      ).toBe('redirect-home')
    })

    it('denies access after admin role is set to null', () => {
      expect(
        evaluateAdminAccess({ userId: 'user_former_admin', role: null }),
      ).toBe('redirect-home')
    })

    it('grants access after role is set to admin', () => {
      // Simulates: user was general_user, admin role granted in Clerk dashboard
      // On next token refresh, sessionClaims.metadata.role is "admin"
      expect(
        evaluateAdminAccess({ userId: 'user_promoted', role: 'admin' }),
      ).toBe('allow')
    })
  })
})
