import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#/components/ui/accordion'
import { FormatDetails } from '#/lib/format-details'

type SubmissionCardProps = {
  topic: string
  details?: string
  submittedBy?: string
  submittedAt: number
}

export function SubmissionCard({
  topic,
  details,
  submittedBy,
  submittedAt,
}: SubmissionCardProps) {
  const relativeTime = getRelativeTime(submittedAt)

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border p-4 text-start">
      <h3 className="text-base font-semibold">{topic}</h3>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>{submittedBy ? `${submittedBy}` : 'Anonymous'}</span>
        <span>{relativeTime}</span>
      </div>

      {details ? (
        <Accordion defaultValue={[]}>
          <AccordionItem value="details" className="border-b-0">
            <AccordionTrigger className="py-0 text-xs text-muted-foreground hover:text-foreground hover:no-underline">
              Show details
            </AccordionTrigger>
            <AccordionContent>
              <FormatDetails text={details} className="text-sm text-muted-foreground" />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <p className="text-xs italic text-muted-foreground">
          No description submitted.
        </p>
      )}
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
