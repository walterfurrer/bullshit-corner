import {
  SignInButton,
  useAuth,
} from '@clerk/tanstack-react-start'
import { CaretDoubleUpIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'

import { Button } from '#/components/ui/button.tsx'
import { MobileNav } from '#/components/mobileNav'
import { UserMenu } from '#/components/userMenu'
import { ENABLE_AUTH, ENABLE_TEST_FEEDBACK } from '#/lib/featureFlags'
import { betaNavLinks, primaryNavLinks } from '#/lib/navigation'

export function SiteHeader() {
  const { isLoaded, isSignedIn } = useAuth()

  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-xs">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" title="Home" aria-label="Home" id="logo" viewTransition>
          <div className="flex items-center gap-2.5">
            <CaretDoubleUpIcon
              size={24}
              weight="bold"
              className="text-primary"
              aria-hidden="true"
            />
            <div className="flex flex-col leading-none">
              <span className="font-racing text-lg tracking-wide sm:text-xl">
                Bullshit Corner
              </span>
              <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                A fan-built project for High Performance Racing
              </span>
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-6 sm:flex">
          <nav aria-label="Site navigation">
            <ul className="flex items-center gap-6">
              {[...primaryNavLinks, ...(ENABLE_TEST_FEEDBACK ? betaNavLinks : [])].map(({ to, label, exact }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="nav-link-desktop"
                    activeProps={{ className: 'nav-link-active' }}
                    activeOptions={exact ? { exact: true } : undefined}
                    viewTransition
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {ENABLE_AUTH && (
            <>
              {!isLoaded ? (
                <div className="size-8 rounded-full bg-muted animate-pulse" />
              ) : isSignedIn ? (
                <UserMenu />
              ) : (
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm">
                    Sign in
                  </Button>
                </SignInButton>
              )}
            </>
          )}
        </div>

        <MobileNav />
      </div>
    </header>
  )
}
