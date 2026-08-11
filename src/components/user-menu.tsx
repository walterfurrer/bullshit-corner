import { useClerk, useUser } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { GearSixIcon, ListBulletsIcon, SignOutIcon, UserCircleIcon } from '@phosphor-icons/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx'
import { Button } from '#/components/ui/button.tsx'

export function UserMenu() {
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          aria-label="User menu"
        >
          <img
            src={user.imageUrl}
            alt=""
            className="size-8 rounded-full"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link to="/your-submissions">
            <ListBulletsIcon className="me-2 size-4" aria-hidden="true" />
            Your Submissions
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <GearSixIcon className="me-2 size-4" aria-hidden="true" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openUserProfile()}>
          <UserCircleIcon className="me-2 size-4" aria-hidden="true" />
          Manage Account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <SignOutIcon className="me-2 size-4" aria-hidden="true" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu >
  )
}
