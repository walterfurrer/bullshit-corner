import { useState } from 'react'
import { SignInButton, useAuth, useClerk, useUser } from '@clerk/tanstack-react-start'
import { ListIcon, SignOutIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'

import { Button } from '#/components/ui/button.tsx'
import { Separator } from '#/components/ui/separator.tsx'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet.tsx'
import { ENABLE_AUTH } from '#/lib/featureFlags'
import { adminNavLinks, primaryNavLinks, userNavLinks } from '#/lib/navigation'
import type { NavLink } from '#/lib/navigation'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const { signOut } = useClerk()

  const isAdmin =
    ENABLE_AUTH && (user?.publicMetadata as Record<string, unknown>)?.role === 'admin'

  function handleNavigate() {
    setOpen(false)
  }

  function handleSignOut() {
    setOpen(false)
    signOut()
  }

  return (
    <div className="flex items-center sm:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <ListIcon size={24} aria-hidden="true" />
        </Button>

        <SheetContent side="right" aria-label="Navigation menu">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4">
            {/* Primary nav links — always visible */}
            <NavSection links={primaryNavLinks} onNavigate={handleNavigate} />

            {/* User links — only when signed in */}
            {ENABLE_AUTH && isSignedIn && (
              <>
                <Separator className="my-3" />
                <NavSection links={userNavLinks} onNavigate={handleNavigate} />
                {isAdmin && (
                  <NavSection links={adminNavLinks} onNavigate={handleNavigate} />
                )}
              </>
            )}
          </nav>

          {/* Footer — sign out or sign in */}
          {ENABLE_AUTH && (
            <div className="mt-auto border-t border-border px-4 py-4">
              {!isLoaded ? (
                <div className="h-10 rounded-sm bg-muted animate-pulse" />
              ) : isSignedIn ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-base"
                  onClick={handleSignOut}
                >
                  <SignOutIcon size={20} aria-hidden="true" />
                  Sign Out
                </Button>
              ) : (
                <SignInButton mode="modal">
                  <Button variant="outline" className="w-full">
                    Sign in or create account
                  </Button>
                </SignInButton>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function NavSection({
  links,
  onNavigate,
}: {
  links: NavLink[]
  onNavigate: () => void
}) {
  return (
    <ul className="flex flex-col gap-1">
      {links.map((link) => (
        <li key={link.to}>
          <Link
            to={link.to}
            className="flex min-h-11 items-center gap-3 rounded-sm px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
            activeProps={{
              className:
                'flex min-h-11 items-center gap-3 rounded-sm px-3 py-2.5 text-base font-medium bg-accent text-accent-foreground',
            }}
            activeOptions={link.exact ? { exact: true } : undefined}
            onClick={onNavigate}
            viewTransition
          >
            <link.icon size={20} aria-hidden={true} />
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
