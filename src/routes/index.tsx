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
          <h1 className="font-racing text-3xl tracking-wide text-foreground sm:text-4xl">
            The Bullshit Corner Leaderboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Every week on High Performance Racing, the crew argues about
            something ridiculous — and it earns a spot here. This is the
            all-time ranking, from the most bullshit down.
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
