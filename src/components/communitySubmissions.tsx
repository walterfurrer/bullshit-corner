import { useState } from 'react'
import { usePaginatedQuery } from 'convex/react'
import { Link } from '@tanstack/react-router'

import { SubmissionCard } from '#/components/submissionCard'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Skeleton } from '#/components/ui/skeleton'
import { Spinner } from '#/components/ui/spinner'
import { api } from '#convex/_generated/api'

const PAGE_SIZE = 24

export function CommunitySubmissions() {
  const [search, setSearch] = useState('')
  const { results, status, loadMore } = usePaginatedQuery(
    api.submissions.listPublic,
    {},
    { initialNumItems: PAGE_SIZE },
  )

  if (status === 'LoadingFirstPage') {
    return <CommunitySubmissionsLoading />
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No community submissions yet</CardTitle>
          <CardDescription>
            Be the first to send a Formula 1 hot take to the Bullshit Corner.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button render={<Link to="/submit-topic" />} nativeButton={false}>
            Submit a topic
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const normalizedSearch = search.trim().toLocaleLowerCase()
  const visibleResults = normalizedSearch
    ? results.filter((submission) =>
        [
          submission.topic,
          submission.submittedBy,
        ]
          .filter((value): value is string => value !== undefined)
          .join(' ')
          .toLocaleLowerCase()
          .includes(normalizedSearch),
      )
    : results

  const canLoadMore = status === 'CanLoadMore' || status === 'LoadingMore'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <label htmlFor="community-submissions-search" className="text-sm font-medium">
            Find a submission
          </label>
          <p className="text-sm text-muted-foreground">
            Search by topic or submitter name.
          </p>
        </div>
        <Input
          id="community-submissions-search"
          type="search"
          placeholder="Search submissions…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-sm"
        />
      </div>

      {visibleResults.length > 0 ? (
        <div className="grid items-start gap-4 sm:grid-cols-2">
          {visibleResults.map((submission) => (
            <SubmissionCard
              key={submission._id}
              variant="readonly"
              topic={submission.topic}
              details={submission.details}
              youtubeUrl={submission.youtubeUrl}
              submittedBy={submission.submittedBy}
              submittedAt={submission.submittedAt}
              status={submission.status}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No matching submissions</CardTitle>
            <CardDescription>
              Try a different topic or submitter name.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {canLoadMore ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => loadMore(PAGE_SIZE)}
            disabled={status === 'LoadingMore'}
          >
            {status === 'LoadingMore' ? (
              <Spinner data-icon="inline-start" aria-hidden="true" />
            ) : null}
            {status === 'LoadingMore' ? 'Loading submissions…' : 'Load more submissions'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function CommunitySubmissionsLoading() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2"
      aria-busy="true"
      aria-label="Loading community submissions"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-36 w-full rounded-lg" />
      ))}
    </div>
  )
}
