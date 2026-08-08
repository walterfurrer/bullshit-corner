import { YoutubeLogoIcon } from '@phosphor-icons/react'

import { cn } from '#/lib/utils.ts'

import type { Doc } from '../../convex/_generated/dataModel'

type LeaderboardEntry = Doc<'entries'> & { episode: Doc<'episodes'> | null }

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function positionStyles(position: number) {
  if (position === 1) return 'bg-gold text-background'
  if (position === 2) return 'bg-silver text-background'
  if (position === 3) return 'bg-bronze text-background'
  return 'border border-border bg-muted text-muted-foreground'
}

function withTimestamp(url: string, seconds?: number) {
  if (seconds == null) return url
  try {
    const withTs = new URL(url)
    withTs.searchParams.set('t', `${Math.max(0, Math.floor(seconds))}s`)
    return withTs.toString()
  } catch {
    return url
  }
}

export function Leaderboard({ entries }: { entries: Array<LeaderboardEntry> }) {
  return (
    <div className="flex flex-col gap-2">
      <h2>HPR's Rankings</h2>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[3rem_1fr_2.5rem] gap-x-3 border-b border-border px-4 py-2.5 text-xs font-medium tracking-widest text-muted-foreground uppercase sm:gap-x-4 sm:px-5">
          <span>Pos</span>
          <span>Topic</span>
        </div>
        <ol className="divide-y divide-border">
          {entries.map((entry, index) => {
            const position = index + 1
            const watchHref = entry.episode?.youtubeUrl
              ? withTimestamp(entry.episode.youtubeUrl, entry.timestampSeconds)
              : null

            return (
              <li key={entry._id}>
                <div className="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-x-3 px-4 py-4 sm:gap-x-4 sm:px-5">
                  <span
                    className={cn(
                      'font-racing flex h-8 w-12 items-center justify-center rounded-md text-base tracking-wide',
                      positionStyles(position),
                    )}
                  >
                    P{position}
                  </span>

                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{entry.title}</p>
                    {entry.description ? (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {entry.description}
                      </p>
                    ) : null}
                    {entry.episode ? (
                      <p className="mt-1.5 font-mono text-xs text-muted-foreground">
                        EP{String(entry.episode.number).padStart(2, '0')} ·{' '}
                        {dateFormatter.format(new Date(entry.episode.airDate))}
                      </p>
                    ) : null}
                  </div>

                  {watchHref ? (
                    <a
                      href={watchHref}
                      target="_blank"
                      rel="noreferrer"
                      className="flex size-10 shrink-0 items-center justify-center justify-self-end rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                      aria-label={`Watch "${entry.title}" on YouTube`}
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
