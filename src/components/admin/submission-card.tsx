import { Button } from '#/components/ui/button.tsx'

interface SubmissionCardProps {
  id: string
  topic: string
  details?: string
  submittedBy?: string
  submittedAt: number
  isChosen: boolean
  onChoose: (id: string) => void
  onUnchoose: (id: string) => void
  isActionPending?: boolean
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '\u2026'
}

export function SubmissionCard({
  id,
  topic,
  details,
  submittedBy,
  submittedAt,
  isChosen,
  onChoose,
  onUnchoose,
  isActionPending = false,
}: SubmissionCardProps) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">
            {truncateText(topic, 200)}
          </p>
          {details && (
            <p className="mt-1 text-sm text-muted-foreground">{details}</p>
          )}
        </div>
        <Button
          variant={isChosen ? 'outline' : 'default'}
          size="sm"
          onClick={() => (isChosen ? onUnchoose(id) : onChoose(id))}
          disabled={isActionPending}
        >
          {isChosen ? 'Undo' : 'Choose'}
        </Button>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {submittedBy && <span>{submittedBy}</span>}
        <span>{formatDate(submittedAt)}</span>
      </div>
    </div>
  )
}
