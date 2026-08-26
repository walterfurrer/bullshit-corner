import { createClerkClient } from '@clerk/backend'
import { useUser } from '@clerk/tanstack-react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useCallback, useEffect } from 'react'

import { MobileSectionPicker } from '#/components/mobileSectionPicker'
import { PageHeader, PageLayout } from '#/components/pageLayout'
import { SectionNavigation } from '#/components/sectionNavigation'
import { Spinner } from '#/components/ui/spinner.tsx'
import { ENABLE_AUTH } from '#/lib/featureFlags'
import { cn } from '#/lib/utils'
import { privateSeo } from '#/lib/seo'

const adminSections = [
  { to: '/admin/leaderboardManagement', label: 'Leaderboard Management' },
  { to: '/admin/submissions', label: 'View Submissions' },
  { to: '/admin/newUsers', label: 'Users' },
] as const

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

const checkAdminAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId } = await auth()
  if (!userId) {
    throw redirect({ to: '/' })
  }
  const user = await clerkClient.users.getUser(userId)
  const role = (user.publicMetadata as Record<string, unknown>)?.role
  if (role !== 'admin') {
    throw redirect({ to: '/' })
  }
})

export const Route = createFileRoute('/_app/admin')({
  head: () => privateSeo('Admin | Bullshit Corner'),
  beforeLoad: async () => {
    if (!ENABLE_AUTH) {
      throw redirect({ to: '/' })
    }

    if (typeof window === 'undefined') {
      await checkAdminAuth()
    }
    // CSR: handled by the component below via useUser()
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const activeSection = adminSections.find(({ to }) => to === pathname) ?? adminSections[0]

  const navigateToSection = useCallback((to: typeof adminSections[number]['to']) => {
    void navigate({ to })
  }, [navigate])

  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      void navigate({ to: '/' })
      return
    }
    const role = (user.publicMetadata as Record<string, unknown>)?.role
    if (role !== 'admin') {
      void navigate({ to: '/' })
    }
  }, [isLoaded, user, navigate])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner
          className="size-8 text-primary"
          aria-label="Checking admin access"
        />
      </div>
    )
  }

  const role = (user?.publicMetadata as Record<string, unknown>)?.role
  if (!user || role !== 'admin') {
    return null // Will redirect via useEffect
  }

  return (
    <PageLayout>
      <PageHeader title="Admin Dashboard" />
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <MobileSectionPicker
          label="Admin section"
          options={adminSections.map(({ to, label }) => ({ value: to, label }))}
          value={activeSection.to}
          onValueChange={navigateToSection}
        />

        <SectionNavigation
          activeValue={activeSection.to}
          ariaLabel="Admin sections"
          id="admin-sections"
          items={adminSections.map(({ to, label }) => ({ value: to, label }))}
          renderItem={(section, isActive) => (
            <Link
              to={section.value}
              className={cn(
                'section-nav-item',
                isActive && 'section-nav-item-active',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {section.label}
            </Link>
          )}
        />

        <div className="glass-section min-w-0 flex-1 rounded-xl p-4 sm:p-6">
          <Outlet />
        </div>
      </div>
    </PageLayout>
  )
}
