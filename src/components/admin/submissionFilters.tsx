import { LayoutGroup, motion, useReducedMotion } from 'motion/react'

import { getMotionTransition } from '#/lib/motion'
import { cn } from '#/lib/utils'

type SubmissionFilter = 'available' | 'dismissed'

interface SubmissionFiltersProps {
  value: SubmissionFilter
  onChange: (filter: SubmissionFilter) => void
}

const filters: { label: string; value: SubmissionFilter }[] = [
  { label: 'Available', value: 'available' },
  { label: 'Dismissed', value: 'dismissed' },
]

const filterClassName =
  'relative -mb-px inline-block px-4 py-2 text-sm font-medium transition-colors'

export type { SubmissionFilter }

export function SubmissionFilters({ value, onChange }: SubmissionFiltersProps) {
  const prefersReducedMotion = useReducedMotion()
  const transition = getMotionTransition(prefersReducedMotion)

  return (
    <LayoutGroup id="submission-filters">
      <div
        className="flex gap-1 border-b"
        role="tablist"
        aria-label="Submission filters"
      >
        {filters.map((filter) => {
          const isActive = filter.value === value

          return (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cn(
                filterClassName,
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => onChange(filter.value)}
            >
              {filter.label}
              {isActive ? (
                <motion.span
                  aria-hidden="true"
                  className="absolute -bottom-px inset-x-4 h-0.5 bg-primary"
                  layoutId="active-submission-filter"
                  transition={{ layout: transition }}
                />
              ) : null}
            </button>
          )
        })}
      </div>
    </LayoutGroup>
  )
}
