import { useCallback, useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-react-start'

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
  component: UserManagement,
})

function UserManagement() {
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
    setPendingUserId(userId)
    try {
      await setUserRole({ data: { userId, role: 'admin' } })
      // Refresh both lists
      await fetchAdmins()
      if (query.trim().length >= 2) {
        const results = await searchUsers({ data: { query: query.trim() } })
        setSearchResults(results)
      }
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
    setPendingUserId(userId)
    try {
      await setUserRole({ data: { userId, role: null } })
      // Refresh both lists
      await fetchAdmins()
      if (query.trim().length >= 2) {
        const results = await searchUsers({ data: { query: query.trim() } })
        setSearchResults(results)
      }
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
      <section>
        <h2 className="mb-3 text-lg font-medium">Search Users</h2>
        <Input
          type="search"
          placeholder="Search users by email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />

        {searchError && (
          <p className="mt-2 text-sm text-destructive">{searchError}</p>
        )}
        {actionError && (
          <p className="mt-2 text-sm text-destructive">{actionError}</p>
        )}

        {/* Search results */}
        {searchLoading && query.trim().length >= 2 && (
          <div className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md border border-border p-3 animate-pulse"
              >
                <div className="size-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 rounded-sm bg-muted" />
                  <div className="h-3 w-48 rounded-sm bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!searchLoading && hasSearched && searchResults.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            No users found matching &ldquo;{query}&rdquo;
          </p>
        )}

        {!searchLoading && searchResults.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
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
          </div>
        )}
      </section>

      {/* Current admins list */}
      <section>
        <h2 className="mb-3 text-lg font-medium">Current Admins</h2>

        {adminsError && (
          <p className="text-sm text-destructive">{adminsError}</p>
        )}

        {adminsLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md border border-border p-3 animate-pulse"
              >
                <div className="size-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 rounded-sm bg-muted" />
                  <div className="h-3 w-48 rounded-sm bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!adminsLoading && admins.length === 0 && !adminsError && (
          <p className="text-sm text-muted-foreground">No admins found.</p>
        )}

        {!adminsLoading && admins.length > 0 && (
          <div className="flex flex-col gap-2">
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
          </div>
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
    <div className="flex items-center gap-3 rounded-md border border-border p-3">
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
    </div>
  )
}
