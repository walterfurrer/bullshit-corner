import { useUser } from '@clerk/tanstack-react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { useEffect } from 'react'

import { AdminNav } from '#/components/admin/adminNav'
import { ENABLE_AUTH } from '#/lib/featureFlags'

export const Route = createFileRoute('/_app/admin')({
  beforeLoad: async () => {
    if (!ENABLE_AUTH) {
      throw redirect({ to: '/' })
    }

    if (typeof window === 'undefined') {
      // SSR: use Clerk server auth to check role from session claims
      const { userId, sessionClaims } = await auth()
      if (!userId) {
        throw redirect({ to: '/' })
      }
      const role = (sessionClaims as any)?.metadata?.role
      if (role !== 'admin') {
        throw redirect({ to: '/' })
      }
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
    <div>
      <AdminNav />
      <Outlet />
    </div>
  )
}
