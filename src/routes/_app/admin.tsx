import { createClerkClient } from '@clerk/backend'
import { useUser } from '@clerk/tanstack-react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useEffect } from 'react'

import { cn } from '#/lib/utils'
import { ENABLE_AUTH } from '#/lib/featureFlags'

const adminSections = [
  { to: '/admin/leaderboardManagement', label: 'Leaderboard Management' },
  { to: '/admin/submissions', label: 'View Submissions' },
  { to: '/admin/userManagement', label: 'User Management' },
  { to: '/admin/newUsers', label: 'New Users' },
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
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  const role = (user?.publicMetadata as Record<string, unknown>)?.role
  if (!user || role !== 'admin') {
    return null // Will redirect via useEffect
  }

  return (
    <>
      <h1 className="mb-4">Admin</h1>
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        {/* Sidebar — vertical on desktop, horizontal scroll on mobile */}
        <nav
          aria-label="Admin sections"
          className="shrink-0 md:w-48 lg:w-56"
        >
          <ul className="flex gap-1 overflow-x-auto pb-2 md:flex-col md:gap-0.5 md:overflow-x-visible md:pb-0">
            {adminSections.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    'block whitespace-nowrap rounded-sm px-3 py-2 text-start text-sm font-medium transition-colors',
                    'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                  )}
                  activeProps={{
                    className: cn(
                      'block whitespace-nowrap rounded-sm px-3 py-2 text-start text-sm font-medium transition-colors',
                      'bg-accent text-accent-foreground',
                    ),
                  }}
                  viewTransition
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content area */}
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </>
  )
}
