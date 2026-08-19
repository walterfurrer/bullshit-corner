import type { ComponentProps } from 'react'

import { Skeleton } from '#/components/ui/skeleton.tsx'
import { cn } from '#/lib/utils'

function AdminUserRow({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="admin-user-row"
      className={cn(
        'flex items-center gap-3 rounded-md border p-3',
        className,
      )}
      {...props}
    />
  )
}

function AdminUserRowSkeleton({
  trailing = 'action',
}: {
  trailing?: 'action' | 'time' | false
}) {
  return (
    <AdminUserRow aria-hidden="true">
      <Skeleton className="size-8 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-48 max-w-full" />
      </div>
      {trailing === 'action' && <Skeleton className="h-8 w-20" />}
      {trailing === 'time' && <Skeleton className="h-3 w-12" />}
    </AdminUserRow>
  )
}

export { AdminUserRow, AdminUserRowSkeleton }
