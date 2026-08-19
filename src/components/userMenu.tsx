import { useClerk, useUser } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { SignOutIcon, UserIcon } from '@phosphor-icons/react'

import { ENABLE_AUTH } from '#/lib/featureFlags'
import { adminNavLinks, userNavLinks } from '#/lib/navigation'

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
        {user?.primaryEmailAddress?.emailAddress && (
          <>
            <div className="px-2 py-1.5">
              <p className="truncate text-sm text-muted-foreground">
                {user.primaryEmailAddress.emailAddress}
              </p>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        {userNavLinks.map((link) => (
          <DropdownMenuItem key={link.to} render={<Link to={link.to} viewTransition />}>
            <link.icon aria-hidden={true} />
            {link.label}
          </DropdownMenuItem>
        ))}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            {adminNavLinks.map((link) => (
              <DropdownMenuItem key={link.to} render={<Link to={link.to} viewTransition />}>
                <link.icon aria-hidden={true} />
                {link.label}
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <SignOutIcon aria-hidden="true" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
