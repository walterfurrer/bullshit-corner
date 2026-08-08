import * as React from 'react'
import { CaretDoubleUpIcon, ListIcon, XIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'

import { Button } from '#/components/ui/button.tsx'

const navLinks = [
  { to: '/' as const, label: 'Home', exact: true },
  { to: '/submit' as const, label: 'Nominate a Topic' },
]

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-4 sm:px-6">
        {/* Logo */}
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
                A fan made project for High Performance Racing
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Site navigation" className="hidden sm:block">
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

        {/* Mobile hamburger + dropdown */}
        <div className="relative sm:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-dropdown"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <XIcon size={20} aria-hidden="true" />
            ) : (
              <ListIcon size={20} aria-hidden="true" />
            )}
          </Button>

          {mobileOpen && (
            <nav
              id="mobile-dropdown"
              aria-label="Mobile navigation"
              className="absolute end-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-xl border border-border bg-background/95 shadow-sm backdrop-blur-sm"
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
              </ul>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
