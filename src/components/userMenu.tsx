import { useClerk, useUser } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { GaugeIcon, GearSixIcon, ListBulletsIcon, SignOutIcon, UserIcon } from '@phosphor-icons/react'

import { ENABLE_AUTH } from '#/lib/featureFlags'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdownMenu'
import { Avatar, AvatarFallback } from '#/components/ui/avatar.tsx'

export function UserMenu() {
  const { signOut } = useClerk()
  const { user } = useUser()
  const isAdmin = ENABLE_AUTH && (user?.publicMetadata as any)?.role === 'admin'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-hidden ring-2 ring-transparent transition-all hover:ring-border focus-visible:ring-ring data-popup-open:ring-border"
        aria-label="User menu"
      >
        <Avatar>
          <AvatarFallback>
            <UserIcon className="size-6 text-primary" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem render={<Link to="/your-submissions" viewTransition />}>
          <ListBulletsIcon className="me-2 size-4" aria-hidden="true" />
          Your Submissions
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/settings" viewTransition />}>
          <GearSixIcon className="me-2 size-4" aria-hidden="true" />
          Settings
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link to="/admin" viewTransition />}>
              <GaugeIcon className="me-2 size-4" aria-hidden="true" />
              Admin Dashboard
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <SignOutIcon className="me-2 size-4" aria-hidden="true" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
