import { useState } from 'react'
import { useClerk } from '@clerk/tanstack-react-start'
import { useConvexMutation } from '@convex-dev/react-query'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { useConvexAuth } from 'convex/react'
import { ConvexError } from 'convex/values'

import { api } from '../../convex/_generated/api'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { SUBMISSION_LIMITS } from '#/lib/submission-constants'
import {
  normalizeSubmission,
  validateLength,
  validateTopic,
} from '#/lib/submission-utils'

type SubmitStatus = 'idle' | 'auth-required' | 'success' | 'error'

export function SubmissionForm() {
  const { openSignIn } = useClerk()
  const { isAuthenticated, isLoading, isRefreshing } = useConvexAuth()
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { mutateAsync } = useMutation({
    mutationFn: useConvexMutation(api.submissions.submit),
  })

  const form = useForm({
    defaultValues: {
      topic: '',
      evidence: '',
      alias: '',
    },
    onSubmit: async ({ value }) => {
      setSubmitStatus('idle')
      setSubmitError(null)

      if (!isAuthenticated) {
        setSubmitStatus('auth-required')
        openSignIn()
        return
      }

      try {
        await mutateAsync(normalizeSubmission(value))
        form.reset()
        setSubmitStatus('success')
      } catch (error) {
        let message = 'Something went wrong. Please try again.'

        if (error instanceof ConvexError) {
          const data = error.data

          if (typeof data === 'string') {
            message = data
          } else if (
            data &&
            typeof data === 'object' &&
            'message' in data &&
            typeof data.message === 'string'
          ) {
            message = data.message
          } else if (
            data &&
            typeof data === 'object' &&
            'kind' in data &&
            'retryAfter' in data
          ) {
            message =
              'You’ve reached the submission limit (6 per week). Please try again later.'
          }
        } else if (error instanceof Error && error.message) {
          message = error.message
        }

        setSubmitStatus('error')
        setSubmitError(message)
      }
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
      className="flex flex-col gap-6"
      noValidate
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-6">
          <form.Field
            name="topic"
            validators={{
              onChange: ({ value }) =>
                validateTopic(value) ??
                validateLength(value, SUBMISSION_LIMITS.topic),
              onBlur: ({ value }) => validateTopic(value),
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>
                  Bullshit Corner Topic
                  <span
                    className="ms-1 text-destructive"
                    aria-hidden="true"
                  >
                    *
                  </span>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="What deserves a spot in Bullshit Corner?"
                  aria-required="true"
                  aria-describedby={
                    field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0
                      ? `${field.name}-error`
                      : undefined
                  }
                  aria-invalid={
                    field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0
                      ? true
                      : undefined
                  }
                />
                {field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0 && (
                    <p
                      id={`${field.name}-error`}
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {field.state.meta.errors[0]}
                    </p>
                  )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="alias"
            validators={{
              onChange: ({ value }) =>
                validateLength(value, SUBMISSION_LIMITS.alias),
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>Name/Alias (optional)</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="The pseudonym shown with your submission"
                  aria-describedby={
                    field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0
                      ? `${field.name}-error`
                      : undefined
                  }
                  aria-invalid={
                    field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0
                      ? true
                      : undefined
                  }
                />
                {field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0 && (
                    <p
                      id={`${field.name}-error`}
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {field.state.meta.errors[0]}
                    </p>
                  )}
              </div>
            )}
          </form.Field>
        </div>

        <form.Field
          name="evidence"
          validators={{
            onChange: ({ value }) =>
              validateLength(value, SUBMISSION_LIMITS.evidence),
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-1.5 sm:h-full">
              <Label htmlFor={field.name}>Evidence (optional)</Label>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="Plead your case here."
                className="sm:flex-1 sm:resize-none"
                rows={6}
                aria-describedby={
                  field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                    ? `${field.name}-error`
                    : undefined
                }
                aria-invalid={
                  field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                    ? true
                    : undefined
                }
              />
              {field.state.meta.isTouched &&
                field.state.meta.errors.length > 0 && (
                  <p
                    id={`${field.name}-error`}
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {field.state.meta.errors[0]}
                  </p>
                )}
            </div>
          )}
        </form.Field>
      </div>

      {submitStatus === 'auth-required' && (
        <div
          className="rounded-sm border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
          role="status"
          aria-live="polite"
        >
          {isAuthenticated
            ? 'You’re signed in. Click “Submit Topic” again to confirm your nomination.'
            : 'Sign in or create an account to continue. Your draft will stay here.'}
        </div>
      )}

      {submitStatus === 'success' && (
        <div
          className="rounded-sm border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-300"
          role="status"
          aria-live="polite"
        >
          Your topic has been submitted! Thanks for contributing.
        </div>
      )}

      {submitStatus === 'error' && submitError && (
        <div
          className="rounded-sm border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
          aria-live="assertive"
        >
          {submitError}
        </div>
      )}

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => {
          const authIsPending = isLoading || isRefreshing
          const disabled = isSubmitting || authIsPending

          return (
            <Button
              type="submit"
              disabled={disabled}
              className="self-start"
              aria-busy={disabled}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                  />
                  <span>Submitting…</span>
                </>
              ) : authIsPending ? (
                'Checking account…'
              ) : (
                'Submit Topic'
              )}
            </Button>
          )
        }}
      </form.Subscribe>
    </form>
  )
}

export default SubmissionForm
