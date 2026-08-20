import { YoutubeLogoIcon } from '@phosphor-icons/react'

import { PositionBadge } from '#/components/positionBadge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'

import type { RankableCommunityEntry } from './communityRankingEditor'

interface CommunityLeaderboardEntry extends RankableCommunityEntry {
  youtubeUrl?: string
  submittedBy?: string
  rankedBy: number
}

export function CommunityLeaderboard({ entries }: { entries: CommunityLeaderboardEntry[] }) {
  if (entries.every((entry) => entry.rankedBy === 0)) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
        No community rankings yet. Be the first person to rank the board.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-[3rem_1fr_2.5rem] gap-x-3 border-b px-4 py-2.5 text-xs font-medium tracking-widest text-muted-foreground uppercase sm:gap-x-4 sm:px-5">
          <span>Pos</span>
          <span>Topic</span>
        </div>
        <ol className="divide-y divide-border">
          {entries.map((entry, index) => (
            <li key={entry.id}>
              <div className="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-x-3 px-4 py-4 sm:gap-x-4 sm:px-5">
                <PositionBadge position={index + 1} />
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="font-semibold text-foreground">{entry.title}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    Ranked by {entry.rankedBy} {entry.rankedBy === 1 ? 'member' : 'members'}
                  </p>
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
                            aria-label={`Watch ${entry.title} on YouTube`}
                          />
                        }
                        className="inline-flex size-8 items-center justify-center justify-self-end rounded-xs text-muted-foreground transition-colors hover:text-primary"
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
    </div>
  )
}
