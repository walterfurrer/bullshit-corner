import { useState } from 'react'
import {
  ArrowFatUpIcon,
  XIcon,
  ArrowCounterClockwiseIcon,
  YoutubeLogoIcon,
} from '@phosphor-icons/react'

import { Button } from '#/components/ui/button.tsx'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip.tsx'
import { FormatDetails } from '#/lib/formatDetails'
import { cn } from '#/lib/utils'

type BaseProps = {
  topic: string
  details?: string
  youtubeUrl?: string
  submittedBy?: string
  submittedAt: number
  presentation?: 'card' | 'list-item'
}

type ReadOnlyProps = BaseProps & {
  variant?: 'readonly'
}

type ActionableProps = BaseProps & {
  variant: 'actionable'
  id: string
  onPromote: (id: string) => void
  onDismiss: (id: string) => void
  isActionPending?: boolean
}

type DismissedProps = BaseProps & {
  variant: 'dismissed'
  id: string
  onUndoDismiss: (id: string) => void
  isActionPending?: boolean
}

export type SubmissionCardProps = ReadOnlyProps | ActionableProps | DismissedProps

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '\u2026'
}

export function SubmissionCard(props: SubmissionCardProps) {
  const { topic, details, youtubeUrl, submittedBy } = props
  const [showDetails, setShowDetails] = useState(false)
  const isListItem = props.presentation === 'list-item'

  return (
    <article
      className={cn(
        'flex flex-col gap-2 p-4 text-start',
        isListItem
          ? 'bg-transparent transition-colors hover:bg-accent/30 focus-within:bg-accent/30'
          : 'glass-section rounded-lg border',
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="font-sans text-base font-semibold tracking-normal">
            {truncateText(topic, 200)}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {submittedBy
              ? `Submitted by ${submittedBy}`
              : 'Submitted anonymously'}
          </p>
        </div>
        <TooltipProvider delay={500}>
          <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
            {youtubeUrl && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="Watch on YouTube"
                    />
                  }
                  className="inline-flex size-11 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:text-primary sm:size-8"
                >
                  <YoutubeLogoIcon size={20} aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent>Watch on YouTube</TooltipContent>
              </Tooltip>
            )}
            {props.variant === 'actionable' && (
              <>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => props.onPromote(props.id)}
                        disabled={props.isActionPending}
                        aria-label="Promote to leaderboard"
                      />
                    }
                    className="size-11 text-muted-foreground hover:text-primary sm:size-8"
                  >
                    <ArrowFatUpIcon data-icon="inline-start" aria-hidden="true" />
                  </TooltipTrigger>
                  <TooltipContent>Promote to leaderboard</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => props.onDismiss(props.id)}
                        disabled={props.isActionPending}
                        aria-label="Dismiss submission"
                      />
                    }
                    className="size-11 text-muted-foreground hover:text-destructive sm:size-8"
                  >
                    <XIcon data-icon="inline-start" aria-hidden="true" />
                  </TooltipTrigger>
                  <TooltipContent>Dismiss</TooltipContent>
                </Tooltip>
              </>
            )}
            {props.variant === 'dismissed' && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => props.onUndoDismiss(props.id)}
                      disabled={props.isActionPending}
                      aria-label="Restore submission"
                    />
                  }
                  className="size-11 text-muted-foreground hover:text-primary sm:size-8"
                >
                  <ArrowCounterClockwiseIcon data-icon="inline-start" aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent>Restore</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </div>

      {details && (
        <div>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
          {showDetails && (
            <FormatDetails
              text={details}
              className="mt-1.5 text-sm text-muted-foreground"
            />
          )}
        </div>
      )}
    </article>
  )
}
