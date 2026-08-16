import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from 'convex/react'

import { api } from '#convex/_generated/api'

/**
 * TanStack Query-compatible query options for users.getMe.
 * Use with `ensureQueryData` in route loaders to prefetch during SSR,
 * and with `useSuspenseQuery` in components for zero-flash rendering.
 */
export const currentUserQuery = convexQuery(api.users.getMe, {})

/**
 * Pure derivation: determines whether a loaded user needs onboarding.
 * A user needs onboarding when their name is empty/undefined AND
 * alwaysAnonymous is false.
 */
export function deriveNeedsOnboarding(user: {
  name?: string
  alwaysAnonymous?: boolean
}): boolean {
  return !user.name && !user.alwaysAnonymous
}

export function useCurrentUser() {
  const queryResult = useQuery(api.users.getMe)

  const isLoading = queryResult === undefined
  const user = queryResult ?? null

  const needsOnboarding =
    !isLoading && user !== null && deriveNeedsOnboarding(user)

  return { user, needsOnboarding, isLoading }
}
