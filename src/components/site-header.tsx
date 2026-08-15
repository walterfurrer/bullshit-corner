import * as React from 'react'
import {
  SignInButton,
  useAuth,
} from '@clerk/tanstack-react-start'
import { CaretDoubleUpIcon, ListIcon, XIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'

import { Button } from '#/components/ui/button.tsx'
import { UserMenu } from '#/components/user-menu.tsx'
import { ENABLE_AUTH } from '#/lib/feature-flags'

const navLinks = [
  { to: '/' as const, label: 'Home', exact: true },
  { to: '/submit-topic' as const, label: 'Submit a Topic' },
]

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const { isLoaded, isSignedIn } = useAuth()

  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" title="Home" aria-label="Home" id="logo">
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
              {navLinks.map(({ to, label, exact }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="nav-link-desktop"
                    activeProps={{ className: 'nav-link-active' }}
                    activeOptions={exact ? { exact: true } : undefined}
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

        <div className="flex items-center gap-2 sm:hidden">
          {ENABLE_AUTH && (
            <>
              {!isLoaded ? (
                <div className="size-8 rounded-full bg-muted animate-pulse" />
              ) : isSignedIn ? (
                <UserMenu />
              ) : null}
            </>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-dropdown"
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? (
              <XIcon size={24} aria-hidden="true" />
            ) : (
              <ListIcon size={24} aria-hidden="true" />
            )}
          </Button>

          {mobileOpen && (
            <nav
              id="mobile-dropdown"
              aria-label="Mobile navigation"
              className="absolute inset-e-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-background/95 shadow-sm backdrop-blur-sm"
            >
              <ul className="flex flex-col py-1">
                {navLinks.map(({ to, label, exact }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="nav-link-mobile"
                      activeProps={{ className: 'nav-link-mobile nav-link-active' }}
                      activeOptions={exact ? { exact: true } : undefined}
                      onClick={() => setMobileOpen(false)}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
                {ENABLE_AUTH && (
                  <li className="border-t border-border/60 px-4 py-2.5">
                    {isLoaded && !isSignedIn && (
                      <SignInButton mode="modal">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setMobileOpen(false)}
                        >
                          Sign in or create account
                        </Button>
                      </SignInButton>
                    )}
                  </li>
                )}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
