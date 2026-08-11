import { createFileRoute, Link } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'

import { Leaderboard } from '#/components/leaderboard.tsx'
import { SiteFooter } from '#/components/site-footer.tsx'
import { SiteHeader } from '#/components/site-header.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Skeleton } from '#/components/ui/skeleton.tsx'

import { api } from '../../convex/_generated/api'

const leaderboardQuery = convexQuery(api.topics.listRanked, { limit: 50 })

export const Route = createFileRoute('/')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(leaderboardQuery)
  },
  pendingComponent: HomePending,
  component: Home,
})

function Home() {
  const { data: topics } = useSuspenseQuery(leaderboardQuery)

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 flex flex-col gap-8 sm:px-6 sm:py-14 sm:gap-10">
        <div className="flex flex-col">
          <h1>
            The Bullshit Corner Leaderboard
          </h1>
          <div className='flex flex-col gap-2'>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Every week the audience of the{" "}
              <a
                href="https://www.thehighperformancepodcast.com/high-performance-racing"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold transition-colors duration-200 hover:text-primary"
              >
                High Performance Racing
              </a>
              {" "}podcast gets to submit things from the world of Formula 1 to go into Bullshit Corner.
            </p>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              It can be a bullshit opinion, a bullshit race, a part of a car, a season, a person, a thing...anything you like!
            </p>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Co-hosts Jake Humphrey, Otmar Szafnauer, and Rob Smedley will then debate them, decide if they deserve to enter Bullshit Corner, and rank them.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2>Have some bullshit to submit?</h2>
          <div className="flex flex-start">

            <Button asChild size="lg">
              <Link to="/submit-topic">Submit a Topic</Link>
            </Button>
          </div>
        </div>
        <Leaderboard topics={topics} />
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
