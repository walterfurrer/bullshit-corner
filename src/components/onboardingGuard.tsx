import { useEffect } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'

import { useCurrentUser } from '#/hooks/useCurrentUser'
import { ENABLE_AUTH } from '#/lib/featureFlags'

/**
 * Client-side redirect guard that navigates new users to `/onboarding`
 * when they haven't yet chosen a display name or opted into anonymity.
 *
 * Renders nothing visible — only triggers a navigation side-effect.
 * Placed in `__root.tsx` after `<SyncUser />`.
 */
export function OnboardingGuard() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { needsOnboarding, isLoading } = useCurrentUser()

  useEffect(() => {
    if (!ENABLE_AUTH) return
    if (isLoading) return
    if (needsOnboarding && pathname !== '/onboarding') {
      void navigate({ to: '/onboarding' })
    }
  }, [isLoading, needsOnboarding, pathname, navigate])

  return null
}
