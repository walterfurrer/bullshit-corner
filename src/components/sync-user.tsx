import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/tanstack-react-start'
import { useConvexAuth, useMutation } from 'convex/react'

import { api } from '../../convex/_generated/api'

const MAX_SYNC_ATTEMPTS = 3
const INITIAL_RETRY_DELAY_MS = 500

export function SyncUser() {
  const { sessionId, userId } = useAuth()
  const { isAuthenticated } = useConvexAuth()
  const syncUser = useMutation(api.users.sync)
  const lastSyncedSession = useRef<string | null>(null)

  useEffect(() => {
    const sessionKey = userId && sessionId ? `${userId}:${sessionId}` : null

    if (!isAuthenticated || !sessionKey) {
      lastSyncedSession.current = null
      return
    }

    if (lastSyncedSession.current === sessionKey) {
      return
    }

    let cancelled = false
    let retryTimeout: ReturnType<typeof setTimeout> | undefined

    const sync = async (attempt: number) => {
      try {
        await syncUser({})

        if (!cancelled) {
          lastSyncedSession.current = sessionKey
        }
      } catch {
        if (!cancelled && attempt < MAX_SYNC_ATTEMPTS) {
          retryTimeout = setTimeout(
            () => void sync(attempt + 1),
            INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1),
          )
        }
      }
    }

    void sync(1)

    return () => {
      cancelled = true

      if (retryTimeout !== undefined) {
        clearTimeout(retryTimeout)
      }
    }
  }, [isAuthenticated, sessionId, syncUser, userId])

  return null
}
