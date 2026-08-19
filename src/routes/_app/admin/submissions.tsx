import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { SubmissionCard } from '#/components/submissionCard'
import {
  SubmissionFilters,
  type SubmissionFilter,
} from '#/components/admin/submissionFilters'

import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'

const paginationOpts = { numItems: 50, cursor: null }

const availableQuery = convexQuery(api.admin.submissions.list, {
  paginationOpts,
})
const dismissedQuery = convexQuery(api.admin.submissions.listDismissed, {
  paginationOpts,
})

export const Route = createFileRoute('/_app/admin/submissions')({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(availableQuery),
      context.queryClient.ensureQueryData(dismissedQuery),
    ])
  },
  component: SubmissionsReview,
})

function SubmissionsReview() {
  const [filter, setFilter] = useState<SubmissionFilter>('available')
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const navigate = useNavigate()

  const { data: availableData } = useSuspenseQuery(availableQuery)
  const { data: dismissedData } = useSuspenseQuery(dismissedQuery)

  const submissions =
    filter === 'available' ? availableData.page : dismissedData.page

  const dismissMutation = useMutation({
    mutationFn: useConvexMutation(api.admin.submissions.dismiss),
    onError: () => {
      setActionError('Failed to dismiss submission. Please try again.')
      setPendingId(null)
    },
    onSuccess: () => {
      setPendingId(null)
      setActionError(null)
    },
  })

  const undoDismissMutation = useMutation({
    mutationFn: useConvexMutation(api.admin.submissions.undoDismiss),
    onError: () => {
      setActionError('Failed to restore submission. Please try again.')
      setPendingId(null)
    },
    onSuccess: () => {
      setPendingId(null)
      setActionError(null)
    },
  })

  function handlePromote(id: string) {
    // Find the submission to pass its data to the leaderboard page
    const submission = submissions.find((s) => s._id === id)
    if (!submission) return

    navigate({
      to: '/admin/leaderboardManagement',
      search: {
        promoteSubmissionId: id,
        promoteTitle: submission.topic,
        promoteYoutubeUrl: submission.youtubeUrl,
        promoteSubmittedBy: submission.submittedBy,
      },
    })
  }

  function handleDismiss(id: string) {
    setActionError(null)
    setPendingId(id)
    dismissMutation.mutate({ id: id as Id<'submissions'> })
  }

  function handleUndoDismiss(id: string) {
    setActionError(null)
    setPendingId(id)
    undoDismissMutation.mutate({ id: id as Id<'submissions'> })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Submission Review</h1>

      <SubmissionFilters value={filter} onChange={setFilter} />

      {actionError && (
        <div
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {actionError}
        </div>
      )}

      {submissions.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          {filter === 'available'
            ? 'No submissions available for review.'
            : 'No dismissed submissions.'}
        </p>
      ) : (
        <div className="space-y-3">
          {filter === 'available'
            ? submissions.map((submission) => (
              <SubmissionCard
                key={submission._id}
                variant="actionable"
                id={submission._id}
                topic={submission.topic}
                details={submission.details}
                youtubeUrl={submission.youtubeUrl}
                submittedBy={submission.submittedBy}
                submittedAt={submission.submittedAt}
                onPromote={handlePromote}
                onDismiss={handleDismiss}
                isActionPending={pendingId === submission._id}
              />
            ))
            : submissions.map((submission) => (
              <SubmissionCard
                key={submission._id}
                variant="dismissed"
                id={submission._id}
                topic={submission.topic}
                details={submission.details}
                youtubeUrl={submission.youtubeUrl}
                submittedBy={submission.submittedBy}
                submittedAt={submission.submittedAt}
                onUndoDismiss={handleUndoDismiss}
                isActionPending={pendingId === submission._id}
              />
            ))}
        </div>
      )}
    </div>
  )
}
