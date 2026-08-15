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
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar.tsx'
import { Button } from '#/components/ui/button.tsx'
import { useCurrentUser } from '#/hooks/use-current-user.ts'

export function UserMenu() {
  const { user } = useCurrentUser()
  const { signOut } = useClerk()

  if (!user) return null

  const initials = user.name
    ? user.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full ring-2 ring-transparent transition-all hover:ring-border focus-visible:ring-ring data-[state=open]:ring-border"
          aria-label="User menu"
        >
          <Avatar>
            {user.imageUrl && (
              <AvatarImage src={user.imageUrl} alt="" />
            )}
            <AvatarFallback>
              {initials ?? <UserIcon className="size-4" aria-hidden="true" />}
            </AvatarFallback>
          </Avatar>
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <SignOutIcon className="me-2 size-4" aria-hidden="true" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
