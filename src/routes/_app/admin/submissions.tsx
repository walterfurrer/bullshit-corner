import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { SubmissionCard } from '#/components/submissionCard'
import {
  SubmissionFilters,
  type SubmissionFilter,
} from '#/components/admin/submissionFilters'

import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'

const paginationOpts = { numItems: 50, cursor: null }

const availableQuery = convexQuery(api.admin.submissions.list, {
  paginationOpts,
})
const chosenQuery = convexQuery(api.admin.submissions.listChosen, {
  paginationOpts,
})

export const Route = createFileRoute('/_app/admin/submissions')({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(availableQuery),
      context.queryClient.ensureQueryData(chosenQuery),
    ])
  },
  component: SubmissionsReview,
})

function SubmissionsReview() {
  const [filter, setFilter] = useState<SubmissionFilter>('available')
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const { data: availableData } = useSuspenseQuery(availableQuery)
  const { data: chosenData } = useSuspenseQuery(chosenQuery)

  const submissions =
    filter === 'available' ? availableData.page : chosenData.page

  const markChosenMutation = useMutation({
    mutationFn: useConvexMutation(api.admin.submissions.markChosen),
    onError: () => {
      setActionError(
        'Failed to mark submission as chosen. Please try again.',
      )
      setPendingId(null)
    },
    onSuccess: () => {
      setPendingId(null)
      setActionError(null)
    },
  })

  const unmarkChosenMutation = useMutation({
    mutationFn: useConvexMutation(api.admin.submissions.unmarkChosen),
    onError: () => {
      setActionError('Failed to undo chosen status. Please try again.')
      setPendingId(null)
    },
    onSuccess: () => {
      setPendingId(null)
      setActionError(null)
    },
  })

  function handleChoose(id: string) {
    setActionError(null)
    setPendingId(id)
    markChosenMutation.mutate({ id: id as Id<'submissions'> })
  }

  function handleUnchoose(id: string) {
    setActionError(null)
    setPendingId(id)
    unmarkChosenMutation.mutate({ id: id as Id<'submissions'> })
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
            : 'No chosen submissions yet.'}
        </p>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <SubmissionCard
              key={submission._id}
              variant="actionable"
              id={submission._id}
              topic={submission.topic}
              details={submission.details}
              submittedBy={submission.submittedBy}
              submittedAt={submission.submittedAt}
              isChosen={filter === 'chosen'}
              onChoose={handleChoose}
              onUnchoose={handleUnchoose}
              isActionPending={pendingId === submission._id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
