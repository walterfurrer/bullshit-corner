/**
 * Bug Condition Exploration Test — Avatar Layout Shift & Settings Auth Crash
 *
 * **Validates: Requirements 1.1, 1.3, 2.1, 2.3**
 *
 * These tests encode the EXPECTED behavior after the fix. They are designed
 * to FAIL on the current unfixed code, confirming both bugs exist.
 *
 * Bug 1 (Layout Shift): When auth is loading (`isLoaded: false`), the header
 *   should render a placeholder with stable dimensions. Currently `<Show>`
 *   renders nothing → test fails.
 *
 * Bug 2 (Settings Auth Crash): When `beforeLoad` runs in a client-side context
 *   (no server request), it should NOT throw. Currently `auth()` crashes → test fails.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'

// ---------------------------------------------------------------------------
// Bug 2: Settings Route Auth Crash — Client-Side Navigation
// ---------------------------------------------------------------------------

/**
 * We test the settings route's `beforeLoad` behavior directly.
 *
 * The bug: `auth()` from `@clerk/tanstack-react-start/server` is called
 * directly in `beforeLoad`. During client-side navigation, there is no server
 * request context, so `auth()` throws:
 *   "Cannot read properties of undefined (reading 'auth')"
 *
 * Expected (fixed): `beforeLoad` should not call `auth()` on the client, or
 * should handle the absence of server context gracefully.
 */
describe('Bug 2: Settings beforeLoad — client-side navigation does not crash', () => {
  // We are in a client-side environment by default in Vitest (typeof window !== 'undefined' in edge-runtime)
  // This mirrors a real client-side SPA navigation.

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('beforeLoad completes without throwing in a client-side context (ENABLE_AUTH=true, authenticated user)', async () => {
    // Mock the feature flag to enable auth
    vi.doMock('#/lib/feature-flags.ts', () => ({
      ENABLE_AUTH: true,
    }))

    // Mock auth() to throw like it does without server context
    // This simulates the real failure: auth() accesses getWebRequest() which
    // returns undefined on the client, then accessing .auth on undefined throws.
    vi.doMock('@clerk/tanstack-react-start/server', () => ({
      auth: () => {
        throw new TypeError(
          "Cannot read properties of undefined (reading 'auth')",
        )
      },
    }))

    // Mock other imports that the settings route needs
    vi.doMock('@tanstack/react-router', () => ({
      createFileRoute: (_path: string) => (opts: unknown) => opts,
      redirect: (opts: unknown) => ({ __redirect: true, ...opts as object }),
    }))

    vi.doMock('convex/react', () => ({
      useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
      useMutation: () => vi.fn(),
    }))

    vi.doMock('#/hooks/use-current-user.ts', () => ({
      useCurrentUser: () => ({ user: null, isLoading: true }),
    }))

    vi.doMock('#/components/site-header.tsx', () => ({
      SiteHeader: () => null,
    }))

    vi.doMock('#/components/ui/button.tsx', () => ({
      Button: () => null,
    }))

    vi.doMock('#/components/ui/card.tsx', () => ({
      Card: () => null,
      CardContent: () => null,
      CardDescription: () => null,
      CardHeader: () => null,
      CardTitle: () => null,
    }))

    vi.doMock('#/components/ui/input.tsx', () => ({
      Input: () => null,
    }))

    vi.doMock('#/components/ui/label.tsx', () => ({
      Label: () => null,
    }))

    vi.doMock('#/components/ui/switch.tsx', () => ({
      Switch: () => null,
    }))

    vi.doMock('#/components/ui/skeleton.tsx', () => ({
      Skeleton: () => null,
    }))

    vi.doMock('#/components/settings/settings-layout-sidebar.tsx', () => ({
      SettingsLayoutSidebar: () => null,
    }))

    vi.doMock('#/components/settings/email-section.tsx', () => ({
      EmailSection: () => null,
    }))

    vi.doMock('#/components/settings/password-section.tsx', () => ({
      PasswordSection: () => null,
    }))

    vi.doMock('#/components/settings/connections-section.tsx', () => ({
      ConnectionsSection: () => null,
    }))

    vi.doMock('#/components/settings/delete-account-section.tsx', () => ({
      DeleteAccountSection: () => null,
    }))

    vi.doMock('#/server/account.ts', () => ({
      getAccountDetails: vi.fn(),
    }))

    vi.doMock('../../convex/_generated/api', () => ({
      api: { users: { updateProfile: 'users:updateProfile' } },
    }))

    // Now import the route — this will use our mocks
    // The createFileRoute mock returns the options object directly
    const settingsModule = await import('#/routes/settings.tsx')

    // Access the Route object — our mock of createFileRoute returns the options
    const routeOptions = (settingsModule as unknown as { Route: { beforeLoad?: () => Promise<void> } }).Route

    // The beforeLoad function should exist
    expect(routeOptions.beforeLoad).toBeDefined()

    // Call beforeLoad in a client-side context — it should NOT throw
    // On UNFIXED code, this WILL throw because auth() is called without
    // the typeof window === 'undefined' guard.
    await expect(routeOptions.beforeLoad!()).resolves.not.toThrow()
  })

  /**
   * Property: For ALL client-side navigation events to /settings where the user
   * is authenticated, beforeLoad must not crash.
   *
   * We generate different mock scenarios to verify the property holds universally.
   */
  it('property: beforeLoad never throws TypeError in client-side context regardless of auth state', async () => {
    // This property test verifies that for ANY combination of auth states
    // during client-side navigation, beforeLoad doesn't throw a TypeError.
    // It may redirect (which is fine), but must not crash.

    // We need to test this as a property across different scenarios
    const authStateArb = fc.record({
      userId: fc.oneof(
        fc.constant(null),
        fc.constant('user_123'),
        fc.string({ minLength: 1, maxLength: 30 }),
      ),
    })

    await fc.assert(
      fc.asyncProperty(authStateArb, async (authState) => {
        vi.resetModules()

        vi.doMock('#/lib/feature-flags.ts', () => ({
          ENABLE_AUTH: true,
        }))

        // Mock auth() to throw — simulating client-side context where
        // getWebRequest() returns undefined
        vi.doMock('@clerk/tanstack-react-start/server', () => ({
          auth: () => {
            throw new TypeError(
              "Cannot read properties of undefined (reading 'auth')",
            )
          },
        }))

        let redirectCalled = false
        vi.doMock('@tanstack/react-router', () => ({
          createFileRoute: (_path: string) => (opts: unknown) => opts,
          redirect: (opts: unknown) => {
            redirectCalled = true
            // Simulate TanStack Router's redirect by throwing a redirect object
            const err = new Error('REDIRECT')
              ; (err as unknown as Record<string, unknown>).__redirect = true
              ; (err as unknown as Record<string, unknown>).to = (opts as Record<string, unknown>)?.to
            throw err
          },
        }))

        vi.doMock('convex/react', () => ({
          useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
          useMutation: () => vi.fn(),
        }))

        vi.doMock('#/hooks/use-current-user.ts', () => ({
          useCurrentUser: () => ({ user: null, isLoading: true }),
        }))

        vi.doMock('#/components/site-header.tsx', () => ({ SiteHeader: () => null }))
        vi.doMock('#/components/ui/button.tsx', () => ({ Button: () => null }))
        vi.doMock('#/components/ui/card.tsx', () => ({
          Card: () => null, CardContent: () => null, CardDescription: () => null,
          CardHeader: () => null, CardTitle: () => null,
        }))
        vi.doMock('#/components/ui/input.tsx', () => ({ Input: () => null }))
        vi.doMock('#/components/ui/label.tsx', () => ({ Label: () => null }))
        vi.doMock('#/components/ui/switch.tsx', () => ({ Switch: () => null }))
        vi.doMock('#/components/ui/skeleton.tsx', () => ({ Skeleton: () => null }))
        vi.doMock('#/components/settings/settings-layout-sidebar.tsx', () => ({
          SettingsLayoutSidebar: () => null,
        }))
        vi.doMock('#/components/settings/email-section.tsx', () => ({ EmailSection: () => null }))
        vi.doMock('#/components/settings/password-section.tsx', () => ({ PasswordSection: () => null }))
        vi.doMock('#/components/settings/connections-section.tsx', () => ({ ConnectionsSection: () => null }))
        vi.doMock('#/components/settings/delete-account-section.tsx', () => ({ DeleteAccountSection: () => null }))
        vi.doMock('#/server/account.ts', () => ({ getAccountDetails: vi.fn() }))
        vi.doMock('../../convex/_generated/api', () => ({
          api: { users: { updateProfile: 'users:updateProfile' } },
        }))

        const settingsModule = await import('#/routes/settings.tsx')
        const routeOptions = (settingsModule as unknown as { Route: { beforeLoad?: () => Promise<void> } }).Route

        // The key assertion: beforeLoad must NOT throw a TypeError.
        // It CAN throw a redirect (that's normal flow), but TypeError = crash = bug.
        try {
          await routeOptions.beforeLoad!()
          // If it resolves without throwing, that's fine (no crash)
        } catch (err) {
          // Redirects are acceptable (ENABLE_AUTH=false redirect, or unauth redirect)
          if (err instanceof Error && (err as unknown as Record<string, unknown>).__redirect) {
            // This is a redirect, not a crash — acceptable
            return
          }
          // TypeError = the bug we're looking for
          if (err instanceof TypeError) {
            // Bug confirmed: auth() threw in client context
            expect.fail(
              `beforeLoad threw TypeError in client-side context: ${err.message}`,
            )
          }
          // Any other error is also unacceptable
          expect.fail(`beforeLoad threw unexpected error: ${String(err)}`)
        }
      }),
      { numRuns: 20 },
    )
  })
})

// ---------------------------------------------------------------------------
// Bug 1: Avatar Layout Shift — Header Auth Area During Loading
// ---------------------------------------------------------------------------

/**
 * We test the SiteHeader's rendering logic when auth is in the loading state.
 *
 * The bug: `<Show when="signed-in">` / `<Show when="signed-out">` from Clerk
 * render NOTHING while auth state is loading. This leaves the auth area empty
 * (zero dimensions), causing layout shift when content eventually appears.
 *
 * Expected (fixed): When `isLoaded: false`, a placeholder element (size-8 = 32×32px)
 * should be rendered to reserve space and prevent CLS.
 *
 * Since we're in edge-runtime (no DOM), we test this by examining what the
 * SiteHeader component structure produces. We mock `useAuth()` and check that
 * when `isLoaded: false`, the `<Show>` components don't swallow the content
 * (on unfixed code they do → test fails).
 */
describe('Bug 1: SiteHeader — auth area renders placeholder during loading state', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('SiteHeader uses useAuth() for conditional rendering instead of <Show> (which swallows content during loading)', async () => {
    // Structural test: verify the FIXED code uses `useAuth` for rendering
    // decisions, not Clerk's `<Show>` component.
    //
    // On UNFIXED code, SiteHeader imports `Show` from Clerk and uses it for
    // conditional rendering. The `Show` component renders nothing during the
    // loading phase (isLoaded: false), causing the layout shift.
    //
    // The FIXED code should import `useAuth` and use it for conditional rendering
    // with a placeholder when `isLoaded: false`.
    //
    // We inspect the source file to confirm the pattern — this works reliably
    // in edge-runtime without needing full React rendering.

    const fs = await import('node:fs')
    const path = await import('node:path')

    // Read the actual source file
    const sourceCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/site-header.tsx'),
      'utf-8',
    )

    // The FIXED code should:
    // 1. Import `useAuth` from '@clerk/tanstack-react-start'
    // 2. NOT import `Show` from '@clerk/tanstack-react-start'
    // 3. Call `useAuth()` and destructure `isLoaded`/`isSignedIn`
    // 4. Render a placeholder when `!isLoaded` (animate-pulse skeleton)

    const importsUseAuth = /import\s*\{[^}]*\buseAuth\b[^}]*\}\s*from\s*['"]@clerk\/tanstack-react-start['"]/.test(sourceCode)
    const importsShow = /import\s*\{[^}]*\bShow\b[^}]*\}\s*from\s*['"]@clerk\/tanstack-react-start['"]/.test(sourceCode)
    const callsUseAuth = /\buseAuth\s*\(\s*\)/.test(sourceCode)
    const hasLoadingPlaceholder = /!isLoaded/.test(sourceCode) && /animate-pulse/.test(sourceCode)

    // On UNFIXED code: Show is imported, useAuth is not → test FAILS.
    expect(importsUseAuth).toBe(true)
    expect(importsShow).toBe(false)
    expect(callsUseAuth).toBe(true)
    expect(hasLoadingPlaceholder).toBe(true)
  })

  /**
   * Property: For ALL auth loading states, the header auth area should produce
   * a rendering decision that includes a placeholder — never "render nothing".
   *
   * We model this as: the source code must contain conditional rendering logic
   * that checks `isLoaded` and renders a placeholder element with stable dimensions.
   * We verify the code structure handles different auth state branches correctly.
   */
  it('property: for any auth loading state, SiteHeader rendering includes a placeholder decision (not empty)', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')

    const sourceCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/site-header.tsx'),
      'utf-8',
    )

    await fc.assert(
      fc.asyncProperty(
        // Generate different "loading" scenarios — all should produce a placeholder
        fc.record({
          isLoaded: fc.constant(false),
          isSignedIn: fc.oneof(fc.constant(undefined), fc.constant(false)),
          userId: fc.constant(undefined),
        }),
        async (_authState) => {
          // For ANY loading state, the code must have the pattern that renders
          // a placeholder. We verify:
          // 1. The code checks `!isLoaded` (not relying on <Show> which hides during loading)
          // 2. When `!isLoaded`, it renders a placeholder with fixed dimensions (size-8)
          // 3. The placeholder has visual feedback (animate-pulse or similar)

          // Check that the rendering logic includes an !isLoaded branch
          const hasIsLoadedCheck = /!isLoaded/.test(sourceCode)
          // Check that there's a placeholder with stable dimensions
          const hasStableDimensionPlaceholder = /size-8/.test(sourceCode) && /rounded-full/.test(sourceCode)
          // Check that it doesn't use <Show> which would render nothing during loading
          const usesShowComponent = /<Show\s/.test(sourceCode)

          expect(hasIsLoadedCheck).toBe(true)
          expect(hasStableDimensionPlaceholder).toBe(true)
          expect(usesShowComponent).toBe(false)
        },
      ),
      { numRuns: 10 },
    )
  })
})
