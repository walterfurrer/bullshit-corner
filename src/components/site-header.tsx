import { CaretDoubleUpIcon } from '@phosphor-icons/react'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl items-center px-4 py-4 sm:px-6">
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
      </div>
    </header>
  )
}
