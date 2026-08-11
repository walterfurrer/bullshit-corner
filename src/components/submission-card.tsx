type SubmissionCardProps = {
  topic: string
  submittedBy?: string
  submittedAt: number
}

export function SubmissionCard({
  topic,
  submittedBy,
  submittedAt,
}: SubmissionCardProps) {
  const relativeTime = getRelativeTime(submittedAt)

  return (
    <article className="rounded-lg border border-border p-4 text-start">
      <h3 className="text-base font-semibold">{topic}</h3>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {submittedBy && <span>by {submittedBy}</span>}
        <span>{relativeTime}</span>
      </div>
    </article>
  )
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diffMs = now - timestamp
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 30) {
    return new Date(timestamp).toLocaleDateString()
  }
  if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  }
  if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  }
  return 'just now'
}
