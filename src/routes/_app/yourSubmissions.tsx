import { Suspense, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useConvexMutation, convexQuery } from '@convex-dev/react-query'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { useConvexAuth } from 'convex/react'

import { SubmissionCard } from '#/components/submissionCard'
import { SiteFooter } from '#/components/siteFooter'
import { Alert, AlertDescription } from '#/components/ui/alert.tsx'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#/components/ui/alertDialog.tsx'
import { Button } from '#/components/ui/button.tsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { Spinner } from '#/components/ui/spinner.tsx'
import { Skeleton } from '#/components/ui/skeleton.tsx'
import { Textarea } from '#/components/ui/textarea.tsx'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip.tsx'
import { normalizeSubmission, validateLength, validateTopic } from '#/lib/submissionUtils'
import { SUBMISSION_LIMITS } from '#/lib/submissionConstants'
import { isValidYouTubeUrl } from '#shared/youtubeUrl'

import { api } from '#convex/_generated/api'
import type { Doc, Id } from '#convex/_generated/dataModel'

export const Route = createFileRoute('/_app/yourSubmissions')({
  head: () => ({
    meta: [{ title: 'Your Submissions | Bullshit Corner' }],
  }),
  component: YourSubmissionsPage,
})

function YourSubmissionsPage() {
  const { isAuthenticated, isLoading } = useConvexAuth()

  if (isLoading) {
    return (
      <PageShell>
        <LoadingSkeleton />
      </PageShell>
    )
  }

  if (!isAuthenticated) {
    return (
      <PageShell>
        <AuthGate />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <Suspense fallback={<LoadingSkeleton />}>
        <SubmissionsList />
      </Suspense>
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <div className="flex flex-col gap-2">
        <h1>Your Submissions</h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Topics you've submitted to Bullshit Corner.
        </p>
      </div>
      {children}
      <SiteFooter />
    </div>
  )
}

function AuthGate() {
  return (
    <div
      className="flex flex-col items-start gap-4"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm text-muted-foreground sm:text-base">
        You must be logged in to see this page.
      </p>
      <Button render={<Link to="/" viewTransition />} nativeButton={false} variant="outline">Go to Home</Button>
    </div>
  )
}

type EditSubmissionField = 'topic' | 'alias' | 'details' | 'youtubeUrl'

type EditSubmissionFieldErrors = Partial<Record<EditSubmissionField, string>>

function getEditSubmissionFieldError(
  field: EditSubmissionField,
  value: string,
  aliasLocked: boolean,
) {
  switch (field) {
    case 'topic':
      return validateTopic(value) ?? validateLength(value, SUBMISSION_LIMITS.topic)
    case 'alias':
      return aliasLocked
        ? undefined
        : validateLength(value, SUBMISSION_LIMITS.alias)
    case 'details':
      return validateLength(value, SUBMISSION_LIMITS.details)
    case 'youtubeUrl': {
      if (!value.trim()) return undefined

      return (
        validateLength(value, SUBMISSION_LIMITS.youtubeUrl) ??
        (isValidYouTubeUrl(value.trim())
          ? undefined
          : 'Please enter a valid YouTube URL')
      )
    }
  }
}

function SubmissionsList() {
  const { data: { submissions, alwaysAnonymous } } = useSuspenseQuery(
    convexQuery(api.submissions.listMine, {}),
  )
  const [editingSubmission, setEditingSubmission] = useState<Doc<'submissions'> | null>(null)
  const [deletingSubmission, setDeletingSubmission] = useState<Doc<'submissions'> | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const updateMutation = useMutation({
    mutationFn: useConvexMutation(api.submissions.update),
  })
  const deleteMutation = useMutation({
    mutationFn: useConvexMutation(api.submissions.remove),
  })

  async function handleUpdate(values: {
    id: Id<'submissions'>
    topic: string
    details?: string
    youtubeUrl?: string
    submittedBy?: string
  }) {
    await updateMutation.mutateAsync(values)
    setEditingSubmission(null)
  }

  async function handleDelete() {
    if (!deletingSubmission) return

    setDeleteError(null)
    try {
      await deleteMutation.mutateAsync({ id: deletingSubmission._id })
      setDeletingSubmission(null)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Unable to delete this submission.')
    }
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-sm text-muted-foreground sm:text-base">
          You haven't submitted any topics yet.
        </p>
        <Button render={<Link to="/submit-topic" viewTransition />} nativeButton={false}>Submit a Topic</Button>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {submissions.map((submission) => (
          <SubmissionCard
            key={submission._id}
            variant="owner"
            id={submission._id}
            topic={submission.topic}
            details={submission.details}
            youtubeUrl={submission.youtubeUrl}
            submittedBy={submission.submittedBy}
            submittedAt={submission.submittedAt}
            isPromoted={submission.promotedAt !== undefined}
            isActionPending={updateMutation.isPending || deleteMutation.isPending}
            onEdit={() => setEditingSubmission(submission)}
            onDelete={() => {
              setDeleteError(null)
              setDeletingSubmission(submission)
            }}
          />
        ))}
      </div>
      <EditSubmissionDialog
        key={editingSubmission?._id ?? 'closed'}
        submission={editingSubmission}
        open={editingSubmission !== null}
        onOpenChange={(open) => {
          if (!open) setEditingSubmission(null)
        }}
        onSave={handleUpdate}
        isPending={updateMutation.isPending}
        aliasLocked={alwaysAnonymous}
      />
      <DeleteSubmissionDialog
        submission={deletingSubmission}
        open={deletingSubmission !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeletingSubmission(null)
        }}
        onDelete={() => void handleDelete()}
        isPending={deleteMutation.isPending}
        error={deleteError}
      />
    </>
  )
}

function EditSubmissionDialog({
  submission,
  open,
  onOpenChange,
  onSave,
  isPending,
  aliasLocked,
}: {
  submission: Doc<'submissions'> | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: {
    id: Id<'submissions'>
    topic: string
    details?: string
    youtubeUrl?: string
    submittedBy?: string
  }) => Promise<void>
  isPending: boolean
  aliasLocked: boolean
}) {
  const [topic, setTopic] = useState(submission?.topic ?? '')
  const [details, setDetails] = useState(submission?.details ?? '')
  const [youtubeUrl, setYoutubeUrl] = useState(submission?.youtubeUrl ?? '')
  const [alias, setAlias] = useState(submission?.submittedBy ?? '')
  const [fieldErrors, setFieldErrors] = useState<EditSubmissionFieldErrors>({})
  const [touchedFields, setTouchedFields] = useState<
    Record<EditSubmissionField, boolean>
  >({
    topic: false,
    alias: false,
    details: false,
    youtubeUrl: false,
  })
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (!submission) return null

  function updateFieldError(field: EditSubmissionField, value: string) {
    if (!touchedFields[field]) return

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: getEditSubmissionFieldError(field, value, aliasLocked),
    }))
  }

  function handleFieldBlur(field: EditSubmissionField, value: string) {
    setTouchedFields((currentTouchedFields) => ({
      ...currentTouchedFields,
      [field]: true,
    }))
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: getEditSubmissionFieldError(field, value, aliasLocked),
    }))
  }

  function validateFields(): EditSubmissionFieldErrors {
    const values: Record<EditSubmissionField, string> = {
      topic,
      alias,
      details,
      youtubeUrl,
    }
    const errors: EditSubmissionFieldErrors = {}

    for (const field of Object.keys(values) as EditSubmissionField[]) {
      const fieldError = getEditSubmissionFieldError(
        field,
        values[field],
        aliasLocked,
      )

      if (fieldError) errors[field] = fieldError
    }

    return errors
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!submission) return

    const errors = validateFields()
    setTouchedFields({
      topic: true,
      alias: true,
      details: true,
      youtubeUrl: true,
    })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    setSubmitError(null)
    try {
      const normalized = normalizeSubmission({
        topic,
        alias: aliasLocked ? 'Anonymous' : alias,
        details,
        youtubeUrl,
      })
      await onSave({
        id: submission._id,
        topic: normalized.topic,
        details: normalized.details,
        youtubeUrl: normalized.youtubeUrl,
        submittedBy: normalized.submittedBy,
      })
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to save your changes.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit submission</DialogTitle>
          <DialogDescription>
            {submission.promotedAt !== undefined
              ? 'This edits your original submission only; the leaderboard entry will not change.'
              : 'Update the topic, alias, details, or linked YouTube video.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-submission-topic">
              Bullshit Corner Topic
              <span className="ms-1 text-destructive" aria-hidden="true">
                *
              </span>
            </Label>
            <Input
              id="edit-submission-topic"
              value={topic}
              onChange={(event) => {
                setTopic(event.target.value)
                updateFieldError('topic', event.target.value)
              }}
              onBlur={(event) => handleFieldBlur('topic', event.target.value)}
              placeholder="What deserves a spot in Bullshit Corner?"
              disabled={isPending}
              aria-required="true"
              aria-describedby={
                touchedFields.topic && fieldErrors.topic
                  ? 'edit-submission-topic-error'
                  : undefined
              }
              aria-invalid={
                touchedFields.topic && fieldErrors.topic ? true : undefined
              }
            />
            {touchedFields.topic && fieldErrors.topic ? (
              <p
                id="edit-submission-topic-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {fieldErrors.topic}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-submission-alias">
              Name/Alias <span className="text-muted-foreground">(optional)</span>
            </Label>
            {aliasLocked ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger render={<span tabIndex={0} className="w-full" />}>
                    <Input
                      id="edit-submission-alias"
                      value="Anonymous"
                      disabled
                      placeholder="Anonymous if left blank."
                      aria-describedby="edit-submission-alias-tooltip"
                    />
                  </TooltipTrigger>
                  <TooltipContent id="edit-submission-alias-tooltip">
                    Change this in Settings to use a display name.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <>
                <Input
                  id="edit-submission-alias"
                  value={alias}
                  onChange={(event) => {
                    setAlias(event.target.value)
                    updateFieldError('alias', event.target.value)
                  }}
                  onBlur={(event) =>
                    handleFieldBlur('alias', event.target.value)
                  }
                  disabled={isPending}
                  placeholder="Anonymous if left blank."
                  aria-describedby={
                    touchedFields.alias && fieldErrors.alias
                      ? 'edit-submission-alias-error'
                      : undefined
                  }
                  aria-invalid={
                    touchedFields.alias && fieldErrors.alias ? true : undefined
                  }
                />
                {touchedFields.alias && fieldErrors.alias ? (
                  <p
                    id="edit-submission-alias-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {fieldErrors.alias}
                  </p>
                ) : null}
              </>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-submission-details">
              Details <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="edit-submission-details"
              value={details}
              onChange={(event) => {
                setDetails(event.target.value)
                updateFieldError('details', event.target.value)
              }}
              onBlur={(event) => handleFieldBlur('details', event.target.value)}
              disabled={isPending}
              placeholder="Why does this deserve a spot?"
              className="min-h-30 flex-1"
              aria-describedby={
                touchedFields.details && fieldErrors.details
                  ? 'edit-submission-details-error'
                  : undefined
              }
              aria-invalid={
                touchedFields.details && fieldErrors.details ? true : undefined
              }
            />
            {touchedFields.details && fieldErrors.details ? (
              <p
                id="edit-submission-details-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {fieldErrors.details}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-submission-youtube-url">
              YouTube Link <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="edit-submission-youtube-url"
              type="url"
              value={youtubeUrl}
              onChange={(event) => {
                setYoutubeUrl(event.target.value)
                updateFieldError('youtubeUrl', event.target.value)
              }}
              onBlur={(event) =>
                handleFieldBlur('youtubeUrl', event.target.value)
              }
              disabled={isPending}
              placeholder="https://youtube.com/watch?v=..."
              aria-describedby={
                touchedFields.youtubeUrl && fieldErrors.youtubeUrl
                  ? 'edit-submission-youtube-url-error'
                  : 'edit-submission-youtube-url-hint'
              }
              aria-invalid={
                touchedFields.youtubeUrl && fieldErrors.youtubeUrl
                  ? true
                  : undefined
              }
            />
            {touchedFields.youtubeUrl && fieldErrors.youtubeUrl ? (
              <p
                id="edit-submission-youtube-url-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {fieldErrors.youtubeUrl}
              </p>
            ) : (
              <p
                id="edit-submission-youtube-url-hint"
                className="text-xs text-muted-foreground"
              >
                Links are reviewed before publishing.
              </p>
            )}
          </div>
          {submitError ? (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteSubmissionDialog({
  submission,
  open,
  onOpenChange,
  onDelete,
  isPending,
  error,
}: {
  submission: Doc<'submissions'> | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
  isPending: boolean
  error: string | null
}) {
  if (!submission) return null

  const isPromoted = submission.promotedAt !== undefined

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this submission?</AlertDialogTitle>
          <AlertDialogDescription>
            {isPromoted
              ? 'This will delete your original submission, but it will not remove the leaderboard entry. The entry will remain and its attribution will change to Anonymous.'
              : 'This permanently deletes your submission.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={isPending}
          >
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            Delete submission
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  )
}
