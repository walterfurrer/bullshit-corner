import { createFileRoute, Link } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'

import { Leaderboard } from '#/components/leaderboard.tsx'
import { PageHeader, PageLayout } from '#/components/pageLayout'
import { SiteFooter } from '#/components/siteFooter'
import { Button } from '#/components/ui/button.tsx'
import { Skeleton } from '#/components/ui/skeleton.tsx'
import { canUseAppViewTransitions } from '#/lib/viewTransitions'
import { leaderboardJsonLd, publicSeo } from '#/lib/seo'

import { api } from '#convex/_generated/api'

const leaderboardQuery = convexQuery(api.entries.listRanked, { limit: 50 })

export const Route = createFileRoute('/_app/')({
  loader: async ({ context }) => {
    const topics = await context.queryClient.ensureQueryData(leaderboardQuery)
    return { seoEntries: topics.map(({ title }) => ({ title })) }
  },
  head: ({ loaderData }) => publicSeo({
    title: 'Home | Bullshit Corner',
    description:
      'Home of the Bullshit Corner leaderboard for the High Performance Racing podcast. View the official rankings, provide your own rankings, and submit topics to be used on future episodes.',
    path: '/',
    jsonLd: leaderboardJsonLd({
      title: 'Bullshit Corner Home',
      path: '/',
      entries: loaderData?.seoEntries ?? [],
      includeWebsite: true,
    }),
  }),
  pendingComponent: HomePending,
  component: Home,
})

function Home() {
  const { data: topics } = useSuspenseQuery(leaderboardQuery)

  return (
    <PageLayout>
      <PageHeader title="Welcome to Bullshit Corner">
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
            {" "} where Host Jake Humphrey, along with Co-Hosts Otmar Szafnauerand Rob Smedley discuss, debate, and rank (or wank) fan-submitted topics surrounding Formula 1.
          </p>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Here you can view the official HPR Leaderboard, submit entries for a future episode, and even provide your own rankings to the community-based leaderboard.
          </p>
        </div>
      </PageHeader>
      <div className="glass-section flex flex-col gap-3 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <h2>Have some bullshit to share?</h2>
        <div className="shrink-0">
          <Button render={<Link to="/submit-topic" viewTransition={canUseAppViewTransitions()} />} nativeButton={false} size="lg">Submit a Topic</Button>
        </div>
      </div>
      <Leaderboard topics={topics} />
      <SiteFooter />
    </PageLayout>
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
