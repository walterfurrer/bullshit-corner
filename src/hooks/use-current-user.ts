import { useQuery } from 'convex/react'

import { api } from '../../convex/_generated/api'

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
