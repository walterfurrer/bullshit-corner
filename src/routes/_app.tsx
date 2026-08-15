import { createFileRoute, Outlet } from '@tanstack/react-router'

import { SiteHeader } from '#/components/site-header.tsx'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main
        className="mx-auto max-w-4xl px-4 py-10 animate-content-enter sm:px-6 sm:py-14"
        style={{ viewTransitionName: 'app-content' }}
      >
        <Outlet />
      </main>
    </div>
  )
}
