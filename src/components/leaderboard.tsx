import { YoutubeLogoIcon } from '@phosphor-icons/react'

import type { Doc } from '../../convex/_generated/dataModel'
import { PositionBadge } from './position-badge'

export function Leaderboard({ topics }: { topics: Array<Doc<'topics'>> }) {
  return (
    <div className="flex flex-col gap-2">
      <h2>HPR's Rankings</h2>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[3rem_1fr_2.5rem] gap-x-3 border-b border-border px-4 py-2.5 text-xs font-medium tracking-widest text-muted-foreground uppercase sm:gap-x-4 sm:px-5">
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

                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{topic.title}</p>
                    {topic.description ? (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {topic.description}
                      </p>
                    ) : null}
                    {topic.submittedBy ? (
                      <p className="mt-1.5 font-mono text-xs text-muted-foreground">
                        Submitted by {topic.submittedBy}
                      </p>
                    ) : null}
                  </div>

                  {topic.youtubeUrl ? (
                    <a
                      href={topic.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex size-10 shrink-0 items-center justify-center justify-self-end rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                      aria-label={`Watch "${topic.title}" on YouTube`}
                    >
                      <YoutubeLogoIcon size={24} weight="fill" />
                    </a>
                  ) : (
                    <span
                      className="flex size-10 shrink-0 items-center justify-center justify-self-end rounded-full text-muted-foreground/25"
                      aria-hidden="true"
                    >
                      <YoutubeLogoIcon size={24} weight="fill" />
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
