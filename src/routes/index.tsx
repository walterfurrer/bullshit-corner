import { createFileRoute } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'

import { Leaderboard } from '#/components/leaderboard.tsx'
import { SiteFooter } from '#/components/site-footer.tsx'
import { SiteHeader } from '#/components/site-header.tsx'
import { Skeleton } from '#/components/ui/skeleton.tsx'

import { api } from '../../convex/_generated/api'

const leaderboardQuery = convexQuery(api.entries.listRanked, { limit: 50 })

export const Route = createFileRoute('/')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(leaderboardQuery)
  },
  pendingComponent: HomePending,
  component: Home,
})

function Home() {
  const { data: entries } = useSuspenseQuery(leaderboardQuery)

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 sm:mb-10">
          <h1>
            The Bullshit Corner Leaderboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Every week the audience of the{" "}
            <a
              href="https://www.thehighperformancepodcast.com/high-performance-racing"
              target="_blank"
              rel="noopener noreferrer"
            >
              High Performance Racing
            </a>
            {" "}podcast gets to nominate things in the world of Formula One to go into Bullshit Corner.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            It can be a bullshit opinion, a bullshit race, a part of a car, a season, a person, a thing...anything you like! Jake, Rob, and Otmar will then debate them, decide if they deserve to enter Bullshit Corner, and finally rank them (as of episode 16).
          </p>
        </div>
        <Leaderboard entries={entries} />
        <SiteFooter />
      </main>
    </div>
  )
}

function HomePending() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 space-y-3 sm:mb-10">
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  )
}
