import { useClerk } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { GearSixIcon, ListBulletsIcon, SignOutIcon, UserIcon } from '@phosphor-icons/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx'
import { Avatar, AvatarFallback } from '#/components/ui/avatar.tsx'

export function UserMenu() {
  const { signOut } = useClerk()

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
        <DropdownMenuItem render={<Link to="/your-submissions" />}>
          <ListBulletsIcon className="me-2 size-4" aria-hidden="true" />
          Your Submissions
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/settings" />}>
          <GearSixIcon className="me-2 size-4" aria-hidden="true" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <SignOutIcon className="me-2 size-4" aria-hidden="true" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
