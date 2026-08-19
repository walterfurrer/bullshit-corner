import { useCallback } from 'react'
import { useUser } from '@clerk/tanstack-react-start'

/**
 * Fire-and-forget write-through to Clerk's user record.
 *
 * Convex is the source of truth for profile data. This hook syncs the display
 * name to Clerk so the Clerk dashboard / admin panel stays consistent. Failures
 * are logged as warnings but never surface to the user.
 */
export function useSyncToClerk() {
  const { user } = useUser()

  /**
   * Sync a display name to Clerk's `firstName` field.
   * Pass `undefined` to clear the name (e.g. when switching to anonymous mode).
   */
  const syncName = useCallback(
    async (name: string | undefined) => {
      if (!user) {
        console.warn('[useSyncToClerk] Clerk user not loaded — skipping sync.')
        return
      }

      try {
        await user.update({ firstName: name ?? '' })
      } catch (error) {
        console.warn('[useSyncToClerk] Failed to sync name to Clerk:', error)
      }
    },
    [user],
  )

  return { syncName }
}
