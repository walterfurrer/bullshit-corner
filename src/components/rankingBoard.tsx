import type { ReactNode } from 'react'

import { YoutubeLogoIcon } from '@phosphor-icons/react'

import { PositionBadge } from '#/components/positionBadge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'

export interface RankingBoardEntry {
  id: string
  position: number
  title: string
  metadata?: ReactNode
  youtubeUrl?: string
}

interface RankingBoardProps {
  entries: RankingBoardEntry[]
  positionLabel?: string
  topicLabel?: string
}

/** Presentational timing-board shared by official and community rankings. */
export function RankingBoard({
  entries,
  positionLabel = 'Pos',
  topicLabel = 'Topic',
}: RankingBoardProps) {
  return (
    <section className="timing-board overflow-hidden" aria-label="Ranked topics">
      <div className="timing-board-header grid grid-cols-[3rem_minmax(0,1fr)_2.5rem] gap-x-3 border-y border-border px-4 py-2.5 text-xs font-medium tracking-widest text-muted-foreground uppercase sm:gap-x-4 sm:px-5">
        <span>{positionLabel}</span>
        <span>{topicLabel}</span>
      </div>
      <ol className="divide-y divide-border border-b border-border">
        {entries.map((entry) => (
          <li key={entry.id}>
            <div className="grid grid-cols-[3rem_minmax(0,1fr)_2.5rem] items-center gap-x-3 px-4 py-4 sm:gap-x-4 sm:px-5">
              <PositionBadge position={entry.position} />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="break-words text-pretty font-semibold text-foreground">{entry.title}</p>
                {entry.metadata}
              </div>
              {entry.youtubeUrl ? (
                <TooltipProvider delay={500}>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <a
                          href={entry.youtubeUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={`Watch "${entry.title}" on YouTube`}
                        />
                      }
                      className="inline-flex size-8 items-center justify-center justify-self-end rounded-xs text-muted-foreground transition-colors hover:text-primary focus-visible:text-primary"
                    >
                      <YoutubeLogoIcon size={24} aria-hidden />
                    </TooltipTrigger>
                    <TooltipContent>Watch on YouTube</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
