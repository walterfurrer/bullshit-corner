import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'

import { SiteHeader } from '#/components/siteHeader'
import { BetaBanner } from '#/components/betaBanner'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isCommunityPage = pathname === '/community'

  return (
    <div className="min-h-dvh">
      <BetaBanner />
      <SiteHeader />
      <div
        className={cn(
          'relative isolate',
          isCommunityPage && 'community-theme min-h-dvh',
        )}
      >
        <div
          aria-hidden
          className="app-page-background pointer-events-none absolute inset-0 -z-10"
          style={{ viewTransitionName: 'app-page-background' }}
        />
        <main
          className={cn(
            'mx-auto max-w-4xl px-4 py-10 animate-content-enter sm:px-6 sm:py-14',
          )}
          style={{ viewTransitionName: 'app-content' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
