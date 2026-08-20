import { YoutubeLogoIcon } from '@phosphor-icons/react'

import type { Doc } from '#convex/_generated/dataModel'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip.tsx'
import { PositionBadge } from './positionBadge'

export function Leaderboard({ topics }: { topics: Array<Doc<'bullshitCornerEntries'>> }) {
  return (
    <div className="flex flex-col gap-2">
      <h2>HPR's Rankings</h2>
      <div className="surface overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-[3rem_1fr_2.5rem] gap-x-3 border-b px-4 py-2.5 text-xs font-medium tracking-widest text-muted-foreground uppercase sm:gap-x-4 sm:px-5">
          <span>Pos</span>
          <span>Topic</span>
        </div>
        <ol className="divide-y divide-border">
          {topics.map((topic, index) => {
            const position = index + 1

            return (
              <li key={topic._id}>
                <div className="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-x-3 px-4 py-4 sm:gap-x-4 sm:px-5">
                  <PositionBadge position={position} />

                  <div className="flex flex-col gap-2">
                    <div className="flex min-w-0 flex-col">
                      <p className="font-semibold text-foreground">{topic.title}</p>
                    </div>
                    {topic.submittedBy ? (
                      <p className="font-mono text-xs text-muted-foreground">
                        Submitted by {topic.submittedBy}
                      </p>
                    ) : null}
                  </div>

                  {topic.youtubeUrl ? (
                    <TooltipProvider delay={500}>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <a
                              href={topic.youtubeUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              aria-label={`Watch "${topic.title}" on YouTube`}
                            />
                          }
                          className="inline-flex size-8 items-center justify-center justify-self-end rounded-xs text-muted-foreground transition-colors hover:text-primary"
                        >
                          <YoutubeLogoIcon size={24} aria-hidden={true} />
                        </TooltipTrigger>
                        <TooltipContent>Watch on YouTube</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
