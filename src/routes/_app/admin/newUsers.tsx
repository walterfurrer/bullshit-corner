import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { usePaginatedQuery } from 'convex/react'

import {
  AdminUserRow,
  AdminUserRowSkeleton,
} from '#/components/admin/adminUserRow'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '#/components/ui/avatar.tsx'
import { Badge } from '#/components/ui/badge.tsx'
import { Button } from '#/components/ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdownMenu.tsx'
import { Separator } from '#/components/ui/separator.tsx'
import { AdminAccessManagement } from '#/routes/_app/admin/userManagement'

import { api } from '#convex/_generated/api'

type UserStatus = 'all' | 'active' | 'deleted'
type SortDirection = 'asc' | 'desc'

const statusLabels: Record<UserStatus, string> = {
  all: 'All users',
  active: 'Active users',
  deleted: 'Deleted users',
}

const signupSortLabels: Record<SortDirection, string> = {
  desc: 'Newest first',
  asc: 'Oldest first',
}

const deletionSortLabels: Record<SortDirection, string> = {
  desc: 'Recently deleted',
  asc: 'Least recently deleted',
}

export const Route = createFileRoute('/_app/admin/newUsers')({
  component: Users,
})

function Users() {
  const [statusFilter, setStatusFilter] = useState<UserStatus>('all')
  const [sort, setSort] = useState<SortDirection>('desc')
  const sortOptions =
    statusFilter === 'deleted' ? deletionSortLabels : signupSortLabels
  const { results: users, status, loadMore } = usePaginatedQuery(
    api.admin.users.list,
    { status: statusFilter, sort },
    { initialNumItems: 25 },
  )

  const isLoadingFirstPage = status === 'LoadingFirstPage'
  const canLoadMore = status === 'CanLoadMore'
  const isLoadingMore = status === 'LoadingMore'

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-racing-compact">Users</h1>
          <p className="text-sm text-muted-foreground">
            Browse every account, including soft-deleted records retained for
            audit purposes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <UserDirectoryMenu
            label={`Status: ${statusLabels[statusFilter]}`}
            value={statusFilter}
            options={statusLabels}
            onValueChange={setStatusFilter}
          />
          <UserDirectoryMenu
            label={`Sort: ${sortOptions[sort]}`}
            value={sort}
            options={sortOptions}
            onValueChange={setSort}
          />
        </div>

        {isLoadingFirstPage ? (
          <div className="flex flex-col gap-2">
            <p className="sr-only" role="status">
              Loading users…
            </p>
            {Array.from({ length: 8 }).map((_, index) => (
              <AdminUserRowSkeleton key={index} trailing="time" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No {statusFilter === 'all' ? '' : `${statusFilter} `}users found.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((user) => (
              <UserRow key={user._id} user={user} />
            ))}
          </div>
        )}

        {canLoadMore || isLoadingMore ? (
          <div>
            <Button
              variant="outline"
              disabled={isLoadingMore}
              onClick={() => loadMore(25)}
            >
              {isLoadingMore ? 'Loading…' : 'Load more users'}
            </Button>
          </div>
        ) : null}
      </section>

      <Separator />

      <AdminAccessManagement />
    </div>
  )
}

function UserDirectoryMenu<Value extends string>({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string
  value: Value
  options: Record<Value, string>
  onValueChange: (value: Value) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline">{label}</Button>}
      />
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {label.startsWith('Status') ? 'Status' : 'Sort'}
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(nextValue) => onValueChange(nextValue as Value)}
          >
            {(Object.keys(options) as Array<Value>).map((optionValue) => (
              <DropdownMenuRadioItem key={optionValue} value={optionValue}>
                {options[optionValue]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface UserRowProps {
  user: {
    _id: string
    _creationTime: number
    name?: string
    email?: string
    imageUrl?: string
    alwaysAnonymous?: boolean
    deletedAt?: number
  }
}

function UserRow({ user }: UserRowProps) {
  const isDeleted = user.deletedAt !== undefined
  const isAnonymous = user.alwaysAnonymous === true
  const displayName = isDeleted
    ? 'Deleted User'
    : isAnonymous
      ? 'Anonymous User'
      : user.name || 'Unnamed'
  const initials = isDeleted || isAnonymous
    ? '?'
    : displayName
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?'
  const activityTime = isDeleted ? user.deletedAt : user._creationTime
  const activityLabel = isDeleted ? 'Deleted' : 'Joined'

  return (
    <AdminUserRow>
      <Avatar>
        {!isDeleted && !isAnonymous ? (
          <AvatarImage src={user.imageUrl} alt={displayName} />
        ) : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <Badge variant={isDeleted ? 'destructive' : 'secondary'}>
            {isDeleted ? 'Deleted' : 'Active'}
          </Badge>
        </div>
        {!isDeleted && !isAnonymous && user.email ? (
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        ) : null}
      </div>

      {activityTime !== undefined ? (
        <time
          dateTime={new Date(activityTime).toISOString()}
          className="shrink-0 text-xs text-muted-foreground"
        >
          {activityLabel} {formatRelativeTime(activityTime)}
        </time>
      ) : null}
    </AdminUserRow>
  )
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const seconds = Math.floor(diffMs / 1000)

  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  return new Date(timestamp).toLocaleDateString()
}
