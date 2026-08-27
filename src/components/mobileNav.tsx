import { useId, useRef, useState, type RefObject } from 'react'
import { SignInButton, useAuth, useClerk, useUser } from '@clerk/tanstack-react-start'
import { ListIcon, SignOutIcon } from '@phosphor-icons/react'
import { Link, useRouterState } from '@tanstack/react-router'

import { Button } from '#/components/ui/button.tsx'
import { Separator } from '#/components/ui/separator.tsx'
import { useMotionHighlightItem, MotionHighlightProvider } from '#/components/ui/motionHighlight.tsx'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet.tsx'
import { ENABLE_AUTH } from '#/lib/featureFlags'
import {
  adminNavLinks,
  primaryNavLinks,
  userNavLinks,
} from '#/lib/navigation'
import { canUseAppViewTransitions } from '#/lib/viewTransitions'
import type { NavLink } from '#/lib/navigation'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const activeLinkRef = useRef<HTMLAnchorElement>(null)
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const { signOut } = useClerk()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

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
          <ListIcon data-icon="inline-start" aria-hidden="true" />
        </Button>

        <SheetContent
          side="right"
          aria-label="Navigation menu"
          initialFocus={() => activeLinkRef.current ?? false}
        >
          <SheetHeader className="min-h-16 flex-row! items-center">
            <SheetTitle>Bullshit Corner</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4">
            {/* Primary nav links — always visible */}
            <NavSection
              links={primaryNavLinks}
              onNavigate={handleNavigate}
              pathname={pathname}
              activeLinkRef={activeLinkRef}
            />

            {/* User links — only when signed in */}
            {ENABLE_AUTH && isSignedIn && (
              <>
                <Separator className="my-3" />
                <NavSection
                  links={userNavLinks}
                  onNavigate={handleNavigate}
                  pathname={pathname}
                  activeLinkRef={activeLinkRef}
                />
                {isAdmin && (
                  <NavSection
                    links={adminNavLinks}
                    onNavigate={handleNavigate}
                    pathname={pathname}
                    activeLinkRef={activeLinkRef}
                  />
                )}
              </>
            )}
          </nav>

          {/* Footer — sign out or sign in */}
          {ENABLE_AUTH && (
            <div className="mt-auto border-t px-4 py-4">
              {!isLoaded ? (
                <div className="h-10 animate-pulse rounded-xs bg-muted" />
              ) : isSignedIn ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-base"
                  onClick={handleSignOut}
                >
                  <SignOutIcon data-icon="inline-start" aria-hidden="true" />
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
  pathname,
  activeLinkRef,
}: {
  links: NavLink[]
  onNavigate: () => void
  pathname: string
  activeLinkRef: RefObject<HTMLAnchorElement | null>
}) {
  const highlightId = useId()

  return (
    <MotionHighlightProvider id={highlightId}>
      {({ clear }) => (
        <ul className="flex flex-col gap-1" onPointerLeave={clear}>
          {links.map((link) => (
            <MobileNavItem
              key={link.to}
              link={link}
              onNavigate={onNavigate}
              isActive={link.exact
                ? pathname === link.to
                : pathname === link.to || pathname.startsWith(`${link.to}/`)}
              activeLinkRef={activeLinkRef}
            />
          ))}
        </ul>
      )}
    </MotionHighlightProvider>
  )
}

function MobileNavItem({
  link,
  onNavigate,
  isActive,
  activeLinkRef,
}: {
  link: NavLink
  onNavigate: () => void
  isActive: boolean
  activeLinkRef: RefObject<HTMLAnchorElement | null>
}) {
  const { activate, indicator } = useMotionHighlightItem()

  return (
    <li>
      <Link
        to={link.to}
        ref={isActive ? activeLinkRef : undefined}
        className="relative isolate flex min-h-11 items-center gap-3 rounded-xs px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
        activeProps={{
          className: 'bg-accent text-accent-foreground',
        }}
        activeOptions={link.exact ? { exact: true } : undefined}
        onClick={onNavigate}
        onFocus={activate}
        onPointerMove={activate}
        viewTransition={canUseAppViewTransitions()}
      >
        {indicator}
        <link.icon size={20} aria-hidden={true} />
        {link.label}
      </Link>
    </li>
  )
}
