type SubmissionFilter = 'available' | 'chosen'

interface SubmissionFiltersProps {
  value: SubmissionFilter
  onChange: (filter: SubmissionFilter) => void
}

export type { SubmissionFilter }

export function SubmissionFilters({ value, onChange }: SubmissionFiltersProps) {
  return (
    <div
      className="flex gap-1 border-b border-border mb-4"
      role="tablist"
      aria-label="Submission filters"
    >
      <button
        role="tab"
        aria-selected={value === 'available'}
        className={`inline-block px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
          value === 'available'
            ? 'text-foreground border-primary'
            : 'text-muted-foreground border-transparent hover:text-foreground'
        }`}
        onClick={() => onChange('available')}
      >
        Available
      </button>
      <button
        role="tab"
        aria-selected={value === 'chosen'}
        className={`inline-block px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
          value === 'chosen'
            ? 'text-foreground border-primary'
            : 'text-muted-foreground border-transparent hover:text-foreground'
        }`}
        onClick={() => onChange('chosen')}
      >
        Chosen
      </button>
    </div>
  )
}
