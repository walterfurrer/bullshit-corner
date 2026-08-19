import { createFileRoute } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '#/components/ui/avatar.tsx'
import { Skeleton } from '#/components/ui/skeleton.tsx'

import { api } from '#convex/_generated/api'

const recentUsersQuery = convexQuery(api.admin.users.listRecent, {})

export const Route = createFileRoute('/_app/admin/newUsers')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(recentUsersQuery)
  },
  pendingComponent: NewUsersPending,
  component: NewUsers,
})

function NewUsers() {
  const { data: users } = useSuspenseQuery(recentUsersQuery)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium">New Users</h2>
        <p className="text-sm text-muted-foreground">
          Most recent signups — updates in real time.
        </p>
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((user) => (
            <UserRow key={user._id} user={user} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── User Row ─────────────────────────────────────────────────────────────────

interface UserRowProps {
  user: {
    _id: string
    _creationTime: number
    name?: string
    email?: string
    imageUrl?: string
    alwaysAnonymous?: boolean
  }
}

function UserRow({ user }: UserRowProps) {
  const isAnonymous = user.alwaysAnonymous === true

  if (isAnonymous) {
    return (
      <div className="flex items-center gap-3 rounded-sm border border-border p-3">
        <Avatar>
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-muted-foreground">
            Anonymous User
          </span>
        </div>
        <time
          dateTime={new Date(user._creationTime).toISOString()}
          className="shrink-0 text-xs text-muted-foreground"
        >
          {formatRelativeTime(user._creationTime)}
        </time>
      </div>
    )
  }

  const displayName = user.name || 'Unnamed'
  const initials =
    displayName
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'

  return (
    <div className="flex items-center gap-3 rounded-sm border border-border p-3">
      <Avatar>
        <AvatarImage src={user.imageUrl} alt={displayName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{displayName}</p>
        {user.email && (
          <p className="truncate text-xs text-muted-foreground">
            {user.email}
          </p>
        )}
      </div>

      <time
        dateTime={new Date(user._creationTime).toISOString()}
        className="shrink-0 text-xs text-muted-foreground"
      >
        {formatRelativeTime(user._creationTime)}
      </time>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diffMs = now - timestamp

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return 'Just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  return new Date(timestamp).toLocaleDateString()
}

// ─── Pending / Skeleton ───────────────────────────────────────────────────────

function NewUsersPending() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-sm border border-border p-3"
          >
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}
