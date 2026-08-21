import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

interface PageLayoutProps {
  children: ReactNode
  className?: string
}

/** Keeps major page regions comfortably spaced without affecting dense UI. */
export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn('flex flex-col gap-10 sm:gap-12', className)}>
      {children}
    </div>
  )
}

interface PageHeaderProps {
  title: ReactNode
  children?: ReactNode
  className?: string
}

/** A semantic page heading with intentionally tight supporting copy. */
export function PageHeader({ title, children, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-1', className)}>
      <h1>{title}</h1>
      {children}
    </header>
  )
}
