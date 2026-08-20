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

import { Spinner } from '#/components/ui/spinner.tsx'
import { ENABLE_AUTH } from '#/lib/featureFlags'

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
    <div className="flex flex-col gap-6 md:flex-row md:gap-8">
      {/* Layout has no heading — each admin child page owns its own <h1>,
          matching the rest of the app's route structure. */}
      {/* Sidebar — vertical on desktop, horizontal scroll on mobile */}
      <nav aria-label="Admin sections" className="section-nav">
        <ul className="section-nav-list">
          {adminSections.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className="section-nav-item"
                activeProps={{
                  className: 'section-nav-item section-nav-item-active',
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
  )
}
