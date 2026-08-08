import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'

import { api } from '../../convex/_generated/api'
import { validateTopic, validateLength, normalizeSubmission } from '#/lib/submission-utils'
import { SUBMISSION_LIMITS } from '#/lib/submission-constants'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'

type SubmitStatus = 'idle' | 'success' | 'error'

export function SubmissionForm() {
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
      try {
        const normalized = normalizeSubmission(value)
        await mutateAsync(normalized)
        form.reset()
        setSubmitStatus('success')
      } catch (err) {
        let message = 'Something went wrong. Please try again.'
        if (err instanceof ConvexError) {
          const data = err.data
          if (typeof data === 'string') {
            message = data
          } else if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
            message = data.message
          }
        } else if (err instanceof Error && err.message) {
          message = err.message
        }
        setSubmitStatus('error')
        setSubmitError(message)
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
      className="flex flex-col gap-6"
      noValidate
    >
      {/* Topic + Alias row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <form.Field
          name="topic"
          validators={{
            onChange: ({ value }) =>
              validateTopic(value) ?? validateLength(value, SUBMISSION_LIMITS.topic),
            onBlur: ({ value }) => validateTopic(value),
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={field.name}>
                Bullshit Corner Topic
                <span className="ms-1 text-destructive" aria-hidden="true">*</span>
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="What deserves a spot in Bullshit Corner?"
                aria-required="true"
                aria-describedby={
                  field.state.meta.isTouched && field.state.meta.errors.length > 0
                    ? `${field.name}-error`
                    : undefined
                }
                aria-invalid={
                  field.state.meta.isTouched && field.state.meta.errors.length > 0
                    ? true
                    : undefined
                }
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <p id={`${field.name}-error`} className="text-sm text-destructive" role="alert">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Alias field */}
        <form.Field
          name="alias"
          validators={{
            onChange: ({ value }) =>
              validateLength(value, SUBMISSION_LIMITS.alias),
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={field.name}>Name/Alias</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Leave blank to submit anonymously"
                aria-describedby={
                  field.state.meta.isTouched && field.state.meta.errors.length > 0
                    ? `${field.name}-error`
                    : undefined
                }
                aria-invalid={
                  field.state.meta.isTouched && field.state.meta.errors.length > 0
                    ? true
                    : undefined
                }
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <p id={`${field.name}-error`} className="text-sm text-destructive" role="alert">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>
      </div>

      {/* Evidence field */}
      <form.Field
        name="evidence"
        validators={{
          onChange: ({ value }) =>
            validateLength(value, SUBMISSION_LIMITS.evidence),
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={field.name}>Evidence</Label>
            <Textarea
              id={field.name}
              name={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Plead your case here."
              rows={4}
              aria-describedby={
                field.state.meta.isTouched && field.state.meta.errors.length > 0
                  ? `${field.name}-error`
                  : undefined
              }
              aria-invalid={
                field.state.meta.isTouched && field.state.meta.errors.length > 0
                  ? true
                  : undefined
              }
            />
            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
              <p id={`${field.name}-error`} className="text-sm text-destructive" role="alert">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Success banner */}
      {submitStatus === 'success' && (
        <div
          className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-300"
          role="status"
          aria-live="polite"
        >
          Your topic has been submitted! Thanks for contributing.
        </div>
      )}

      {/* Error banner */}
      {submitStatus === 'error' && submitError && (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
          aria-live="assertive"
        >
          {submitError}
        </div>
      )}

      {/* Submit button */}
      <form.Subscribe
        selector={(state) => state.isSubmitting}
      >
        {(isSubmitting) => (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="self-start"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span
                  className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden="true"
                />
                <span>Submitting…</span>
              </>
            ) : (
              'Submit Topic'
            )}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}

export default SubmissionForm
