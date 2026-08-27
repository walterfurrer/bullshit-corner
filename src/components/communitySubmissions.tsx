import { useEffect, useState } from 'react'
import { useQuery } from 'convex/react'
import { Link } from '@tanstack/react-router'
import {
  CheckCircleIcon,
  XCircleIcon,
  YoutubeLogoIcon,
  ArrowSquareOutIcon,
} from '@phosphor-icons/react'

import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { FormatDetails } from '#/lib/formatDetails'
import { formatSubmissionTopic } from '#/lib/submissionFormatting'
import { cn } from '#/lib/utils'
import { api } from '#convex/_generated/api'
import { getYouTubeEmbedUrl } from '#shared/youtubeUrl'

const PAGE_SIZE = 12
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

type CommunitySubmission = SortableSubmission & {
  _id: string
  details?: string
  youtubeUrl?: string
  status?: SubmissionStatus | null
}

type SubmissionStatus = 'promoted' | 'dismissed'

const submissionCollator = new Intl.Collator(undefined, {
  sensitivity: 'base',
  numeric: true,
})

export function CommunitySubmissions() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SubmissionSort>('newest')
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageCursors, setPageCursors] = useState<Array<string | null>>([null])
  const pageCursor = pageCursors[pageIndex] ?? null
  const submissionsPage = useQuery(
    api.submissions.listPublic,
    { paginationOpts: { numItems: PAGE_SIZE, cursor: pageCursor } },
  )
  const results = submissionsPage?.page ?? []

  useEffect(() => {
    try {
      const storedSort = window.localStorage.getItem(SUBMISSION_SORT_STORAGE_KEY)
      if (isSubmissionSort(storedSort)) setSortBy(storedSort)
    } catch {
      // Ignore unavailable storage and keep the default sort order.
    }
  }, [])

  useEffect(() => {
    if (
      selectedSubmissionId &&
      submissionsPage &&
      !results.some((submission) => submission._id === selectedSubmissionId)
    ) {
      setSelectedSubmissionId(null)
    }
  }, [results, selectedSubmissionId, submissionsPage])

  if (!submissionsPage) {
    return <CommunitySubmissionsLoading />
  }

  const currentPage = submissionsPage

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
  const selectedSubmission = results.find(
    (submission) => submission._id === selectedSubmissionId,
  )

  const canGoToPreviousPage = pageIndex > 0
  const canGoToNextPage = !currentPage.isDone

  function showPreviousPage() {
    setPageIndex((currentPage) => Math.max(0, currentPage - 1))
  }

  function showNextPage() {
    if (currentPage.isDone) return

    setPageCursors((cursors) => [
      ...cursors.slice(0, pageIndex + 1),
      currentPage.continueCursor,
    ])
    setPageIndex((currentPage) => currentPage + 1)
  }

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
        <div className="grid gap-4 md:grid-cols-3">
          {sortedResults.map((submission) => (
            <CommunitySubmissionCard
              key={submission._id}
              submission={submission}
              onViewDetails={() => setSelectedSubmissionId(submission._id)}
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

      {canGoToPreviousPage || canGoToNextPage ? (
        <nav
          className="flex items-center justify-center gap-3"
          aria-label="Community submissions pages"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={showPreviousPage}
            disabled={!canGoToPreviousPage}
          >
            Previous
          </Button>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Page {pageIndex + 1}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={showNextPage}
            disabled={!canGoToNextPage}
          >
            Next
          </Button>
        </nav>
      ) : null}

      <SubmissionDetailsDialog
        submission={selectedSubmission}
        onOpenChange={(open) => {
          if (!open) setSelectedSubmissionId(null)
        }}
      />
    </div>
  )
}

function CommunitySubmissionCard({
  submission,
  onViewDetails,
}: {
  submission: CommunitySubmission
  onViewDetails: () => void
}) {
  const canViewDetails = Boolean(submission.details || submission.youtubeUrl)

  return (
    <Card size="sm" className="h-full min-h-40">
      <CardHeader className="gap-2">
        <h2 className="line-clamp-3 font-sans text-base/normal font-medium tracking-normal">
          {formatSubmissionTopic(submission.topic)}
        </h2>
        <CardDescription>
          {submission.submittedBy
            ? `Submitted by ${submission.submittedBy}`
            : 'Submitted anonymously'}
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-10 justify-center">
        <div className="flex flex-wrap items-center gap-2">
          {submission.status ? <SubmissionStatus status={submission.status} /> : null}
          {submission.youtubeUrl ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <YoutubeLogoIcon size={16} aria-hidden="true" />
              Video attached
            </span>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="mt-auto min-h-8">
        {canViewDetails ? (
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            View submission
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}

function SubmissionDetailsDialog({
  submission,
  onOpenChange,
}: {
  submission: CommunitySubmission | undefined
  onOpenChange: (open: boolean) => void
}) {
  const embedUrl = submission?.youtubeUrl
    ? getYouTubeEmbedUrl(submission.youtubeUrl)
    : undefined

  return (
    <Dialog open={submission !== undefined} onOpenChange={onOpenChange}>
      {submission ? (
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="pe-8">
            <DialogTitle>{formatSubmissionTopic(submission.topic)}</DialogTitle>
            <DialogDescription>
              {submission.submittedBy
                ? `Submitted by ${submission.submittedBy}`
                : 'Submitted anonymously'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            {submission.status ? <SubmissionStatus status={submission.status} /> : null}

            {embedUrl ? (
              <iframe
                className="aspect-video w-full rounded-lg border bg-muted"
                src={embedUrl}
                title={`YouTube video for ${formatSubmissionTopic(submission.topic)}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : null}

            {submission.details ? (
              <section className="flex flex-col gap-2">
                <h3 className="font-medium">Details</h3>
                <FormatDetails text={submission.details} className="text-muted-foreground" />
              </section>
            ) : null}
          </div>

          {submission.youtubeUrl ? (
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                render={
                  <a
                    href={submission.youtubeUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  />
                }
              >
                <ArrowSquareOutIcon data-icon="inline-start" aria-hidden="true" />
                Open on YouTube
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      ) : null}
    </Dialog>
  )
}

function SubmissionStatus({ status }: { status: SubmissionStatus }) {
  const config = {
    promoted: {
      label: 'Entered Bullshit Corner',
      Icon: CheckCircleIcon,
      className: 'text-success',
    },
    dismissed: {
      label: 'Denied entry',
      Icon: XCircleIcon,
      className: 'text-destructive',
    },
  }[status]

  return (
    <p className={cn('inline-flex items-center gap-1.5 text-xs font-medium', config.className)}>
      <config.Icon size={15} weight="bold" aria-hidden="true" />
      {config.label}
    </p>
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
      className="grid gap-4 md:grid-cols-3"
      aria-busy="true"
      aria-label="Loading community submissions"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-40 w-full rounded-lg" />
      ))}
    </div>
  )
}
