import { FlagCheckeredIcon } from '@phosphor-icons/react'

import { Badge } from '#/components/ui/badge.tsx'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <FlagCheckeredIcon
            size={20}
            weight="fill"
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
        <Badge
          variant="outline"
          className="hidden text-xs tracking-wide text-muted-foreground sm:inline-flex"
        >
          Fan Rankings — Coming Soon
        </Badge>
      </div>
    </header>
  )
}
