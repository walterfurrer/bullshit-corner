import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#/components/ui/accordion.tsx'
import { Button } from '#/components/ui/button.tsx'
import { FormatDetails } from '#/lib/formatDetails'
import { YoutubeLogoIcon } from '@phosphor-icons/react'

type BaseProps = {
  topic: string
  details?: string
  youtubeUrl?: string
  submittedBy?: string
  submittedAt: number
}

type ReadOnlyProps = BaseProps & {
  variant?: 'readonly'
}

type ActionableProps = BaseProps & {
  variant: 'actionable'
  id: string
  isChosen: boolean
  onChoose: (id: string) => void
  onUnchoose: (id: string) => void
  isActionPending?: boolean
}

export type SubmissionCardProps = ReadOnlyProps | ActionableProps

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp))
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '\u2026'
}

export function SubmissionCard(props: SubmissionCardProps) {
  const { topic, details, youtubeUrl, submittedBy, submittedAt } = props

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border p-4 text-start">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-base font-semibold">
          {truncateText(topic, 200)}
        </h3>
        {props.variant === 'actionable' && (
          <Button
            variant={props.isChosen ? 'outline' : 'default'}
            size="sm"
            onClick={() =>
              props.isChosen
                ? props.onUnchoose(props.id)
                : props.onChoose(props.id)
            }
            disabled={props.isActionPending}
          >
            {props.isChosen ? 'Undo' : 'Choose'}
          </Button>
        )}
      </div>

      {details ? (
        <Accordion defaultValue={[]}>
          <AccordionItem value="details" className="border-b-0">
            <AccordionTrigger className="group/details py-0 text-xs text-muted-foreground hover:text-foreground hover:no-underline">
              <span className="group-aria-expanded/details:hidden">
                Show details
              </span>
              <span className="hidden group-aria-expanded/details:inline">
                Hide details
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <FormatDetails
                text={details}
                className="text-sm text-muted-foreground"
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <p className="text-xs italic text-muted-foreground">
          No description submitted.
        </p>
      )}

      {youtubeUrl && (
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <YoutubeLogoIcon size={14} aria-hidden="true" />
          Watch video
        </a>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          {submittedBy
            ? `Submitted as ${submittedBy}`
            : 'Submitted anonymously'}
        </span>
        <span>{formatDate(submittedAt)}</span>
      </div>
    </article>
  )
}
