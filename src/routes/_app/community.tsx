import { SignInButton } from '@clerk/tanstack-react-start'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'

import { CommunityLeaderboard } from '#/components/communityLeaderboard'
import { CommunityRankingEditor } from '#/components/communityRankingEditor'
import { PageHeader, PageLayout } from '#/components/pageLayout'
import { SiteFooter } from '#/components/siteFooter'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import { ENABLE_AUTH } from '#/lib/featureFlags'
import { leaderboardJsonLd, publicSeo } from '#/lib/seo'
import { api } from '#convex/_generated/api'

const communityBoardQuery = convexQuery(api.communityRankings.list, {})
const personalRankingQuery = convexQuery(api.communityRankings.getMine, {})

export const Route = createFileRoute('/_app/community')({
  loader: async ({ context }) => {
    const [entries] = await Promise.all([
      context.queryClient.ensureQueryData(communityBoardQuery),
      context.queryClient.ensureQueryData(personalRankingQuery),
    ])
    return { seoEntries: entries.map(({ title }) => ({ title })) }
  },
  head: ({ loaderData }) => publicSeo({
    title: 'Community Rankings | Bullshit Corner',
    description:
      'Disagree with the official ranking from High Performance Racing? Provide your own ranking of the current leaderboard topics and vote with the rest of the community!',
    path: '/community',
    jsonLd: leaderboardJsonLd({
      title: 'Community Bullshit Corner Rankings',
      path: '/community',
      entries: loaderData?.seoEntries ?? [],
    }),
  }),
  pendingComponent: CommunityPending,
  component: CommunityPage,
})

function CommunityPage() {
  const { data: entries } = useSuspenseQuery(communityBoardQuery)
  const { data: savedEntryIds } = useSuspenseQuery(personalRankingQuery)
  const { isAuthenticated, isLoading } = useConvexAuth()

  return (
    <PageLayout>
      <PageHeader title="Community Leaderboard">
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          See how the community ranks the current entries in Bullshit Corner.
          Every member can rank as many entries as they like.
        </p>
      </PageHeader>

      <CommunityLeaderboard entries={entries} />

      <div className="mt-6 sm:mt-8">
        {ENABLE_AUTH && isLoading ? (
          <CommunityRankingLoading
            entries={entries}
            savedEntryIds={savedEntryIds}
          />
        ) : ENABLE_AUTH && isAuthenticated ? (
          <CommunityRankingEditor entries={entries} savedEntryIds={savedEntryIds} />
        ) : ENABLE_AUTH ? (
          <Card>
            <CardHeader>
              <CardTitle>Want to shape the board?</CardTitle>
              <CardDescription>
                Sign in or create a free account to add your ranking to the community aggregate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <SignInButton mode="modal">
                  <Button>Sign in to rank</Button>
                </SignInButton>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <SiteFooter />
    </PageLayout>
  )
}

function CommunityRankingLoading({
  entries,
  savedEntryIds,
}: {
  entries: Parameters<typeof CommunityRankingEditor>[0]['entries']
  savedEntryIds: Parameters<typeof CommunityRankingEditor>[0]['savedEntryIds']
}) {
  const entryById = new Map(entries.map((entry) => [entry.id, entry]))
  const rankedEntries = savedEntryIds.flatMap((id) => {
    const entry = entryById.get(id)
    return entry ? [entry] : []
  })
  const availableEntries = entries.filter((entry) => !savedEntryIds.includes(entry.id))

  return (
    <Card className="xl:relative xl:left-1/2 xl:w-[min(100vw-3rem,80rem)] xl:-translate-x-1/2">
      <CardHeader>
        <CardTitle className="text-xl/7 font-semibold tracking-normal">Your ranking</CardTitle>
        <CardDescription>
          Rank as many entries as you like. Unranked entries are treated as no opinion.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(22rem,1fr)] xl:gap-8">
          <RankingListLoading
            title="Ranked entries"
            description="Drag to reorder or use the remove button."
            entries={rankedEntries}
            ranked
          />
          <RankingListLoading
            title="Available entries"
            description="Choose only the entries you want to rank."
            entries={availableEntries}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-3">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-28" />
      </CardFooter>
    </Card>
  )
}

function RankingListLoading({
  title,
  description,
  entries,
  ranked = false,
}: {
  title: string
  description: string
  entries: Parameters<typeof CommunityRankingEditor>[0]['entries']
  ranked?: boolean
}) {
  return (
    <section className="flex flex-col gap-3" aria-busy="true">
      <div>
        <h3 className="text-lg/6 font-semibold tracking-normal">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {entries.length > 0 ? (
        <div className="glass-collection overflow-hidden rounded-xl divide-y divide-border">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={
                ranked
                  ? 'grid grid-cols-[2rem_auto_minmax(0,1fr)_2rem] items-center gap-2 px-3 py-3 sm:grid-cols-[2.25rem_auto_minmax(0,1fr)_2rem] sm:gap-3 sm:px-4'
                  : 'grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2 px-3 py-3 sm:grid-cols-[2.25rem_minmax(0,1fr)_2rem] sm:gap-3 sm:px-4'
              }
            >
              <Skeleton className="size-5" />
              {ranked ? <Skeleton className="h-8 w-12" /> : null}
              <span className="relative min-w-0">
                <span className="invisible block break-words text-pretty font-medium">
                  {entry.title}
                </span>
                <Skeleton className="absolute start-0 top-1/2 h-5 w-3/4 -translate-y-1/2" />
              </span>
              <Skeleton className="size-8 justify-self-end" />
            </div>
          ))}
        </div>
      ) : ranked ? (
        <p className="glass-collection relative rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
          <span className="invisible">Add at least one entry to create your ranking.</span>
          <Skeleton className="absolute h-5 w-3/4" />
        </p>
      ) : null}
    </section>
  )
}

function CommunityPending() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
