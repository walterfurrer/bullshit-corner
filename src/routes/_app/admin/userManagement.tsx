import { useCallback, useEffect, useRef, useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-react-start'

import {
  AdminUserRow,
  AdminUserRowSkeleton,
} from '#/components/admin/adminUserRow'
import { AnimatedStatus } from '#/components/ui/animatedStatus.tsx'
import { Alert, AlertDescription } from '#/components/ui/alert.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Badge } from '#/components/ui/badge.tsx'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '#/components/ui/avatar.tsx'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip.tsx'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#/components/ui/alertDialog.tsx'

import {
  listAdminUsers,
  searchUsers,
  setUserRole,
  type AdminUser,
} from '#/server/admin'

export const Route = createFileRoute('/_app/admin/userManagement')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/newUsers' })
  },
})

export function AdminAccessManagement() {
  const { user: currentUser } = useUser()
  const currentUserId = currentUser?.id ?? null

  // --- Admin list state ---
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [adminsLoading, setAdminsLoading] = useState(true)
  const [adminsError, setAdminsError] = useState<string | null>(null)

  // --- Search state ---
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AdminUser[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // --- Action state ---
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  // --- Remove confirmation dialog ---
  const [removeTarget, setRemoveTarget] = useState<AdminUser | null>(null)

  // --- Fetch admin list ---
  const fetchAdmins = useCallback(async () => {
    setAdminsLoading(true)
    setAdminsError(null)
    try {
      const result = await listAdminUsers()
      setAdmins(result)
    } catch (err) {
      setAdminsError(
        err instanceof Error ? err.message : 'Failed to load admins',
      )
    } finally {
      setAdminsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAdmins()
  }, [fetchAdmins])

  // --- Debounced search ---
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setSearchResults([])
      setHasSearched(false)
      setSearchError(null)
      return
    }

    setSearchLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchUsers({ data: { query: query.trim() } })
        setSearchResults(results)
        setHasSearched(true)
        setSearchError(null)
      } catch (err) {
        setSearchError(
          err instanceof Error ? err.message : 'Search failed',
        )
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // --- Role actions ---
  async function handleMakeAdmin(userId: string) {
    setActionError(null)
    setActionFeedback(null)
    setPendingUserId(userId)
    try {
      await setUserRole({ data: { userId, role: 'admin' } })
      // Refresh both lists
      await fetchAdmins()
      if (query.trim().length >= 2) {
        const results = await searchUsers({ data: { query: query.trim() } })
        setSearchResults(results)
      }
      setActionFeedback('Administrator access granted.')
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to update role',
      )
    } finally {
      setPendingUserId(null)
    }
  }

  async function handleRemoveAdmin(userId: string) {
    setRemoveTarget(null)
    setActionError(null)
    setActionFeedback(null)
    setPendingUserId(userId)
    try {
      await setUserRole({ data: { userId, role: null } })
      // Refresh both lists
      await fetchAdmins()
      if (query.trim().length >= 2) {
        const results = await searchUsers({ data: { query: query.trim() } })
        setSearchResults(results)
      }
      setActionFeedback('Administrator access removed.')
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to update role',
      )
    } finally {
      setPendingUserId(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-racing-compact">
          Admin Access
        </h2>
        <p className="text-sm text-muted-foreground">
          Find Clerk accounts and grant or remove administrator access.
        </p>
      </div>

      <AnimatedStatus show={!!actionError} variant="destructive" aria-live="assertive">
        <AlertDescription>{actionError}</AlertDescription>
      </AnimatedStatus>
      <AnimatedStatus show={!!actionFeedback} variant="success" aria-live="polite">
        <AlertDescription>{actionFeedback}</AlertDescription>
      </AnimatedStatus>

      <section>
        <h2 className="mb-3 text-lg font-medium tracking-racing-compact">
          Search Users
        </h2>
        <Input
          type="search"
          placeholder="Search users by email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />

        {searchError && (
          <Alert className="mt-2" variant="destructive">
            <AlertDescription>{searchError}</AlertDescription>
          </Alert>
        )}

        {/* Search results */}
        {searchLoading && query.trim().length >= 2 && (
          <div className="mt-4">
            <p className="sr-only" role="status">
              Searching users…
            </p>
            <ul className="glass-collection overflow-hidden rounded-xl divide-y divide-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <AdminUserRowSkeleton key={i} />
              ))}
            </ul>
          </div>
        )}

        {!searchLoading && hasSearched && searchResults.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            No users found matching &ldquo;{query}&rdquo;
          </p>
        )}

        {!searchLoading && searchResults.length > 0 && (
          <ul className="glass-collection mt-4 overflow-hidden rounded-xl divide-y divide-border">
            {searchResults.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                currentUserId={currentUserId}
                pendingUserId={pendingUserId}
                onMakeAdmin={handleMakeAdmin}
                onRemoveAdmin={(user) => setRemoveTarget(user)}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Current admins list */}
      <section>
        <h2 className="mb-3 text-lg font-medium tracking-racing-compact">
          Current Admins
        </h2>

        {adminsError && (
          <Alert variant="destructive">
            <AlertDescription>{adminsError}</AlertDescription>
          </Alert>
        )}

        {adminsLoading && (
          <div>
            <p className="sr-only" role="status">
              Loading administrators…
            </p>
            <ul className="glass-collection overflow-hidden rounded-xl divide-y divide-border">
              {Array.from({ length: 2 }).map((_, i) => (
                <AdminUserRowSkeleton key={i} />
              ))}
            </ul>
          </div>
        )}

        {!adminsLoading && admins.length === 0 && !adminsError && (
          <p className="text-sm text-muted-foreground">No admins found.</p>
        )}

        {!adminsLoading && admins.length > 0 && (
          <ul className="glass-collection overflow-hidden rounded-xl divide-y divide-border">
            {admins.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                currentUserId={currentUserId}
                pendingUserId={pendingUserId}
                onMakeAdmin={handleMakeAdmin}
                onRemoveAdmin={(user) => setRemoveTarget(user)}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Remove admin confirmation dialog */}
      <AlertDialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin access for{' '}
              <strong>
                {removeTarget?.firstName} {removeTarget?.lastName}
              </strong>
              ? They will immediately lose access to admin features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (removeTarget) void handleRemoveAdmin(removeTarget.id)
              }}
            >
              Remove Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// --- User Card Component ---

interface UserCardProps {
  user: AdminUser
  currentUserId: string | null
  pendingUserId: string | null
  onMakeAdmin: (userId: string) => void
  onRemoveAdmin: (user: AdminUser) => void
}

function UserCard({
  user,
  currentUserId,
  pendingUserId,
  onMakeAdmin,
  onRemoveAdmin,
}: UserCardProps) {
  const isCurrentUser = user.id === currentUserId
  const isAdmin = user.role === 'admin'
  const isPending = pendingUserId === user.id

  const initials = [user.firstName?.[0], user.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?'

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown'

  return (
    <AdminUserRow>
      <Avatar>
        <AvatarImage src={user.imageUrl} alt={displayName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{displayName}</span>
          {isAdmin && <Badge variant="secondary">Admin</Badge>}
          {isCurrentUser && (
            <Badge variant="outline">You</Badge>
          )}
        </div>
        {user.email && (
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        )}
      </div>

      <div className="shrink-0">
        {isCurrentUser ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="sm" disabled>
                    {isAdmin ? 'Remove' : 'Make Admin'}
                  </Button>
                }
              />
              <TooltipContent>
                You cannot change your own admin role
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : isAdmin ? (
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => onRemoveAdmin(user)}
          >
            {isPending ? 'Removing…' : 'Remove Admin'}
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            disabled={isPending}
            onClick={() => onMakeAdmin(user.id)}
          >
            {isPending ? 'Adding…' : 'Make Admin'}
          </Button>
        )}
      </div>
    </AdminUserRow>
  )
}
