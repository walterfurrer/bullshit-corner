import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { SubmissionCard } from '#/components/submissionCard'
import {
  SubmissionFilters,
  type SubmissionFilter,
} from '#/components/admin/submissionFilters'
import { AnimatedStatus } from '#/components/ui/animatedStatus.tsx'
import { AlertDescription } from '#/components/ui/alert.tsx'
import { compactListItem, fadeBlur, getMotionTransition } from '#/lib/motion'

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
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const transition = getMotionTransition(prefersReducedMotion)

  const { data: availableData } = useSuspenseQuery(availableQuery)
  const { data: dismissedData } = useSuspenseQuery(dismissedQuery)

  const submissions =
    filter === 'available' ? availableData.page : dismissedData.page

  const dismissMutation = useMutation({
    mutationFn: useConvexMutation(api.admin.submissions.dismiss),
    onError: () => {
      setActionError('Failed to dismiss submission. Please try again.')
      setActionFeedback(null)
      setPendingId(null)
    },
    onSuccess: () => {
      setPendingId(null)
      setActionError(null)
      setActionFeedback('Submission dismissed.')
    },
  })

  const undoDismissMutation = useMutation({
    mutationFn: useConvexMutation(api.admin.submissions.undoDismiss),
    onError: () => {
      setActionError('Failed to restore submission. Please try again.')
      setActionFeedback(null)
      setPendingId(null)
    },
    onSuccess: () => {
      setPendingId(null)
      setActionError(null)
      setActionFeedback('Submission restored.')
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
    setActionFeedback(null)
    setPendingId(id)
    dismissMutation.mutate({ id: id as Id<'submissions'> })
  }

  function handleUndoDismiss(id: string) {
    setActionError(null)
    setActionFeedback(null)
    setPendingId(id)
    undoDismissMutation.mutate({ id: id as Id<'submissions'> })
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold tracking-racing-compact">
        Submission Review
      </h2>

      <SubmissionFilters value={filter} onChange={setFilter} />

      <AnimatedStatus show={!!actionError} variant="destructive" aria-live="assertive">
        <AlertDescription>{actionError}</AlertDescription>
      </AnimatedStatus>
      <AnimatedStatus show={!!actionFeedback} variant="success" aria-live="polite">
        <AlertDescription>{actionFeedback}</AlertDescription>
      </AnimatedStatus>

      <AnimatePresence initial={false} mode="wait">
        {submissions.length === 0 ? (
          <motion.p
            key={`${filter}-empty`}
            {...fadeBlur}
            transition={transition}
            className="py-8 text-center text-muted-foreground"
          >
            {filter === 'available'
              ? 'No submissions available for review.'
              : 'No dismissed submissions.'}
          </motion.p>
        ) : (
          <motion.div
            key={filter}
            {...fadeBlur}
            transition={transition}
            className="glass-collection overflow-hidden rounded-xl divide-y divide-border"
          >
            <AnimatePresence initial={false}>
              {submissions.map((submission) => (
                <motion.div
                  key={submission._id}
                  {...compactListItem}
                  layout="position"
                  transition={transition}
                  className="overflow-hidden"
                >
                  {filter === 'available' ? (
                    <SubmissionCard
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
                      presentation="list-item"
                    />
                  ) : (
                    <SubmissionCard
                      variant="dismissed"
                      id={submission._id}
                      topic={submission.topic}
                      details={submission.details}
                      youtubeUrl={submission.youtubeUrl}
                      submittedBy={submission.submittedBy}
                      submittedAt={submission.submittedAt}
                      onUndoDismiss={handleUndoDismiss}
                      isActionPending={pendingId === submission._id}
                      presentation="list-item"
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
