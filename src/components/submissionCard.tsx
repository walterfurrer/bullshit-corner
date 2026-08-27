import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useId, useState } from 'react'
import {
  ArrowFatUpIcon,
  XIcon,
  ArrowCounterClockwiseIcon,
  PencilSimpleIcon,
  TrashIcon,
  TrophyIcon,
  YoutubeLogoIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@phosphor-icons/react'

import { Button } from '#/components/ui/button.tsx'
import { Badge } from '#/components/ui/badge.tsx'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip.tsx'
import { FormatDetails } from '#/lib/formatDetails'
import { getMotionTransition } from '#/lib/motion'
import { formatSubmissionTopic } from '#/lib/submissionFormatting'
import { cn } from '#/lib/utils'

export type SubmissionStatus = 'promoted' | 'dismissed'

type BaseProps = {
  topic: string
  details?: string
  youtubeUrl?: string
  submittedBy?: string
  submittedAt: number
  status?: SubmissionStatus | null
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

type OwnerProps = BaseProps & {
  variant: 'owner'
  id: string
  isPromoted: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  isActionPending?: boolean
}

export type SubmissionCardProps = ReadOnlyProps | ActionableProps | DismissedProps | OwnerProps

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '\u2026'
}

export function SubmissionCard(props: SubmissionCardProps) {
  const { topic, details, youtubeUrl, submittedBy, status } = props
  const [showDetails, setShowDetails] = useState(false)
  const detailsId = useId()
  const isListItem = props.presentation === 'list-item'
  const isReadOnly = props.variant === undefined || props.variant === 'readonly'
  const prefersReducedMotion = useReducedMotion()
  const transition = getMotionTransition(prefersReducedMotion)

  return (
    <article
      className={cn(
        'flex h-auto min-h-36 flex-col gap-3 p-4 text-start',
        isListItem
          ? 'bg-transparent transition-colors hover:bg-accent/30 focus-within:bg-accent/30'
          : 'glass-section rounded-lg border',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-sans text-base font-semibold tracking-normal">
              {truncateText(formatSubmissionTopic(topic), 200)}
            </h2>
            {props.variant === 'owner' && props.isPromoted ? (
              <Badge variant="outline">
                <TrophyIcon data-icon="inline-start" aria-hidden="true" />
                On leaderboard
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {submittedBy
              ? `Submitted by ${submittedBy}`
              : 'Submitted anonymously'}
          </p>
          {status ? (
            <div className="mt-2">
              <SubmissionStatusBadge status={status} />
            </div>
          ) : null}
        </div>
      <TooltipProvider delay={500}>
          <div className="flex shrink-0 items-center gap-1">
            {!isReadOnly && youtubeUrl ? <YoutubeLink youtubeUrl={youtubeUrl} /> : null}
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
            {props.variant === 'owner' && (
              <>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => props.onEdit(props.id)}
                        disabled={props.isActionPending}
                        aria-label="Edit submission"
                      />
                    }
                    className="size-11 text-muted-foreground hover:text-primary sm:size-8"
                  >
                    <PencilSimpleIcon data-icon="inline-start" aria-hidden="true" />
                  </TooltipTrigger>
                  <TooltipContent>Edit submission</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => props.onDelete(props.id)}
                        disabled={props.isActionPending}
                        aria-label="Delete submission"
                      />
                    }
                    className="size-11 text-muted-foreground hover:text-destructive sm:size-8"
                  >
                    <TrashIcon data-icon="inline-start" aria-hidden="true" />
                  </TooltipTrigger>
                  <TooltipContent>Delete submission</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </TooltipProvider>
      </div>

      {(details || (isReadOnly && youtubeUrl)) && (
        <div>
          <div className="flex items-center justify-between gap-3">
            {details ? (
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-muted-foreground hover:text-foreground"
                aria-controls={detailsId}
                aria-expanded={showDetails}
              >
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
            ) : (
              <span aria-hidden="true" />
            )}
            {isReadOnly && youtubeUrl ? (
              <TooltipProvider delay={500}>
                <YoutubeLink youtubeUrl={youtubeUrl} />
              </TooltipProvider>
            ) : null}
          </div>
          {details ? (
            <AnimatePresence initial={false}>
              {showDetails ? (
                <motion.div
                  id={detailsId}
                  initial={{ height: 0, opacity: 0, filter: 'blur(2px)' }}
                  animate={{ height: 'auto', opacity: 1, filter: 'blur(0px)' }}
                  exit={{ height: 0, opacity: 0, filter: 'blur(2px)' }}
                  transition={transition}
                  className="overflow-hidden"
                >
                  <FormatDetails
                    text={details}
                    className="mt-1.5 text-sm text-muted-foreground"
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          ) : null}
        </div>
      )}
    </article>
  )
}

function YoutubeLink({ youtubeUrl }: { youtubeUrl: string }) {
  return (
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
  )
}

function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const config = {
    promoted: {
      label: 'Entered Bullshit Corner',
      Icon: CheckCircleIcon,
      className: 'text-success',
    },
    dismissed: {
      label: 'Denied entry',
      Icon: XCircleIcon,
      className: 'text-destructive',
    },
  }[status]

  return (
    <div className={cn('inline-flex items-center gap-1.5 text-xs font-medium', config.className)}>
      <config.Icon size={15} weight="bold" aria-hidden="true" />
      {config.label}
    </div>
  )
}
