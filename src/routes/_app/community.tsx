import { SignInButton } from '@clerk/tanstack-react-start'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'

import { CommunityLeaderboard } from '#/components/communityLeaderboard'
import { CommunityRankingEditor } from '#/components/communityRankingEditor'
import { SiteFooter } from '#/components/siteFooter'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import { ENABLE_AUTH } from '#/lib/featureFlags'
import { api } from '#convex/_generated/api'

const communityBoardQuery = convexQuery(api.communityRankings.list, {})
const personalRankingQuery = convexQuery(api.communityRankings.getMine, {})

export const Route = createFileRoute('/_app/community')({
  head: () => ({ meta: [{ title: 'Community Leaderboard | Bullshit Corner' }] }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(communityBoardQuery),
      context.queryClient.ensureQueryData(personalRankingQuery),
    ])
  },
  pendingComponent: CommunityPending,
  component: CommunityPage,
})

function CommunityPage() {
  const { data: entries } = useSuspenseQuery(communityBoardQuery)
  const { data: savedEntryIds } = useSuspenseQuery(personalRankingQuery)
  const { isAuthenticated } = useConvexAuth()

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <div className="flex flex-col gap-2">
        <h1>Community Leaderboard</h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          See how the community ranks the current entries in Bullshit Corner.
          Every member can rank as many entries as they like.
        </p>
      </div>

      <CommunityLeaderboard entries={entries} />

      <div className="mt-6 sm:mt-10">
        {ENABLE_AUTH && isAuthenticated ? (
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
    </div>
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
