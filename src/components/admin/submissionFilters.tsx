type SubmissionFilter = 'available' | 'dismissed'

interface SubmissionFiltersProps {
  value: SubmissionFilter
  onChange: (filter: SubmissionFilter) => void
}

export type { SubmissionFilter }

export function SubmissionFilters({ value, onChange }: SubmissionFiltersProps) {
  return (
    <div
      className="mb-4 flex gap-1 border-b border-border"
      role="tablist"
      aria-label="Submission filters"
    >
      <button
        role="tab"
        aria-selected={value === 'available'}
        className={`-mb-px inline-block border-b-2 px-4 py-2 text-sm font-medium transition-colors ${value === 'available'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        onClick={() => onChange('available')}
      >
        Available
      </button>
      <button
        role="tab"
        aria-selected={value === 'dismissed'}
        className={`-mb-px inline-block border-b-2 px-4 py-2 text-sm font-medium transition-colors ${value === 'dismissed'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        onClick={() => onChange('dismissed')}
      >
        Dismissed
      </button>
    </div>
  )
}
