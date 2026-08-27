import { useEffect, useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { api } from '#convex/_generated/api'

const PAGE_SIZE = 24
const SUBMISSION_SORT_STORAGE_KEY = 'bullshit-corner:community-submission-sort'

const submissionSortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'topic', label: 'Topic A–Z' },
  { value: 'submitter', label: 'Submitter A–Z' },
] as const

type SubmissionSort = (typeof submissionSortOptions)[number]['value']

type SortableSubmission = {
  topic: string
  submittedBy?: string
  submittedAt: number
}

const submissionCollator = new Intl.Collator(undefined, {
  sensitivity: 'base',
  numeric: true,
})

export function CommunitySubmissions() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SubmissionSort>('newest')
  const { results, status, loadMore } = usePaginatedQuery(
    api.submissions.listPublic,
    {},
    { initialNumItems: PAGE_SIZE },
  )

  useEffect(() => {
    try {
      const storedSort = window.localStorage.getItem(SUBMISSION_SORT_STORAGE_KEY)
      if (isSubmissionSort(storedSort)) setSortBy(storedSort)
    } catch {
      // Ignore unavailable storage and keep the default sort order.
    }
  }, [])

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
  const sortedResults = [...visibleResults].sort((left, right) =>
    compareSubmissions(left, right, sortBy),
  )

  const canLoadMore = status === 'CanLoadMore' || status === 'LoadingMore'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <label htmlFor="community-submissions-search" className="text-sm font-medium">
            Find a submission
          </label>
          <p className="text-sm text-muted-foreground">
            Search by topic or submitter name.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Input
            id="community-submissions-search"
            type="search"
            placeholder="Search submissions…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:w-64"
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="community-submissions-sort" className="text-sm font-medium">
              Sort by
            </label>
            <Select
              items={submissionSortOptions}
              value={sortBy}
              onValueChange={(nextValue) => {
                if (!isSubmissionSort(nextValue)) return

                setSortBy(nextValue)
                try {
                  window.localStorage.setItem(SUBMISSION_SORT_STORAGE_KEY, nextValue)
                } catch {
                  // Ignore unavailable storage; the current selection still applies.
                }
              }}
            >
              <SelectTrigger id="community-submissions-sort" className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {submissionSortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {sortedResults.length > 0 ? (
        <div className="grid items-start gap-4 sm:grid-cols-2">
          {sortedResults.map((submission) => (
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

function isSubmissionSort(value: string | null): value is SubmissionSort {
  return submissionSortOptions.some((option) => option.value === value)
}

function compareSubmissions(
  left: SortableSubmission,
  right: SortableSubmission,
  sortBy: SubmissionSort,
) {
  if (sortBy === 'oldest') return left.submittedAt - right.submittedAt

  if (sortBy === 'topic') {
    return submissionCollator.compare(left.topic, right.topic)
  }

  if (sortBy === 'submitter') {
    return submissionCollator.compare(
      left.submittedBy ?? 'Anonymous',
      right.submittedBy ?? 'Anonymous',
    )
  }

  return right.submittedAt - left.submittedAt
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
