import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'

import { SiteHeader } from '#/components/siteHeader'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isCommunityPage = pathname === '/community'

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <div
        className={cn(
          'relative isolate min-h-dvh',
          isCommunityPage && 'community-theme',
        )}
      >
        <div
          aria-hidden
          className="app-page-background pointer-events-none absolute inset-0 -z-10"
          style={{
            viewTransitionName: isCommunityPage ? 'none' : 'app-page-background',
          }}
        />
        <main
          className={cn(
            'mx-auto max-w-4xl px-4 py-10 animate-content-enter sm:px-6 sm:py-14',
          )}
          style={{
            // Community owns the named transition on its tab content so the
            // page header and section navigation stay out of tab transitions.
            viewTransitionName: isCommunityPage ? 'none' : 'app-content',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
