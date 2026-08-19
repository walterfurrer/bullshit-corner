import { createFileRoute, Link } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'

import { Leaderboard } from '#/components/leaderboard.tsx'
import { SiteFooter } from '#/components/siteFooter'
import { Button } from '#/components/ui/button.tsx'
import { Skeleton } from '#/components/ui/skeleton.tsx'

import { api } from '#convex/_generated/api'

const leaderboardQuery = convexQuery(api.entries.listRanked, { limit: 50 })

export const Route = createFileRoute('/_app/')({
  head: () => ({
    meta: [{ title: 'Home | Bullshit Corner' }],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(leaderboardQuery)
  },
  pendingComponent: HomePending,
  component: Home,
})

function Home() {
  const { data: topics } = useSuspenseQuery(leaderboardQuery)

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <div className="flex flex-col">
        <h1>
          Welcome to Bullshit Corner
        </h1>
        <div className="flex flex-col gap-2">
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Bullshit Corner is a segment on the Formula 1 podcast, {" "}
            <a
              href="https://www.thehighperformancepodcast.com/high-performance-racing"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold transition-colors duration-200 hover:text-primary"
            >
              High Performance Racing
            </a>
            {" "} where co-hosts Jake Humphrey, Otmar Szafnauer, and Rob Smedley discuss, debate, and rank various fan-submitted topics surrounding Formula 1.
          </p>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Here you can view the offical HPR Leaderboard, submit your own entires for a future episode, and even provide your own rankings to the community-based leaderboard.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h2>Have some bullshit to submit?</h2>
        <div>
          <Button render={<Link to="/submit-topic" viewTransition />} nativeButton={false} size="lg">Submit a Topic</Button>
        </div>
      </div>
      <Leaderboard topics={topics} />
      <SiteFooter />
    </div>
  )
}

function HomePending() {
  return (
    <>
      <div className="mb-8 flex flex-col gap-3 sm:mb-10">
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </>
  )
}
