import { useState } from 'react'
import { useClerk } from '@clerk/tanstack-react-start'
import { useConvexMutation } from '@convex-dev/react-query'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { useConvexAuth } from 'convex/react'
import { ConvexError } from 'convex/values'

import { api } from '#convex/_generated/api'
import { AlertDescription } from '#/components/ui/alert'
import { AnimatedStatus } from '#/components/ui/animatedStatus'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Spinner } from '#/components/ui/spinner'
import { Textarea } from '#/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { ENABLE_AUTH } from '#/lib/featureFlags'
import { SUBMISSION_LIMITS } from '#/lib/submissionConstants'
import {
  normalizeSubmission,
  validateLength,
  validateTopic,
} from '#/lib/submissionUtils'
import { isValidYouTubeUrl } from '#shared/youtubeUrl'

import type { Doc } from '#convex/_generated/dataModel'

type SubmitStatus = 'idle' | 'auth-required' | 'success' | 'error'

interface SubmissionFormProps {
  /** Prefetched user from the route loader. `null` means signed out. */
  user: Doc<'users'> | null
}

export function SubmissionForm({ user }: SubmissionFormProps) {
  const { openSignIn } = useClerk()
  // useConvexAuth still needed for real-time auth changes (e.g. user signs in
  // via the auth-required flow while the form is open)
  const { isAuthenticated } = useConvexAuth()
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Derive alias field behavior from user profile
  const aliasLocked = ENABLE_AUTH && !!user && user.alwaysAnonymous === true

  const { mutateAsync } = useMutation({
    mutationFn: useConvexMutation(api.submissions.submit),
  })

  const form = useForm({
    defaultValues: {
      topic: '',
      alias: user?.alwaysAnonymous
        ? 'Anonymous'
        : (user?.name ?? ''),
      details: '',
      youtubeUrl: '',
    },
    onSubmit: async ({ value }) => {
      setSubmitStatus('idle')
      setSubmitError(null)

      if (!isAuthenticated) {
        if (!ENABLE_AUTH) {
          setSubmitStatus('error')
          setSubmitError('Submissions are currently closed.')
          return
        }
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
              'You\u2019ve reached the submission limit (6 per week). Please try again later.'
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
      className="glass-section flex flex-col gap-6 rounded-xl p-5 sm:p-6"
      noValidate
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Left column: Topic, Alias, YouTube */}
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
                aliasLocked
                  ? undefined
                  : validateLength(value, SUBMISSION_LIMITS.alias),
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>
                  Name/Alias <span className="text-muted-foreground">(optional)</span>
                </Label>
                {aliasLocked ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger render={<span tabIndex={0} className="w-full" />}>
                        <Input
                          id={field.name}
                          name={field.name}
                          value="Anonymous"
                          disabled
                          placeholder="Anonymous if left blank."
                          aria-describedby={`${field.name}-tooltip`}
                        />
                      </TooltipTrigger>
                      <TooltipContent id={`${field.name}-tooltip`}>
                        Change this in Settings to use a display name.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Anonymous if left blank."
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
                  </>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="youtubeUrl"
            validators={{
              onChange: ({ value }) => {
                if (!value.trim()) return undefined
                const lengthErr = validateLength(value, SUBMISSION_LIMITS.youtubeUrl)
                if (lengthErr) return lengthErr
                if (!isValidYouTubeUrl(value.trim())) {
                  return 'Please enter a valid YouTube URL'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>
                  YouTube Link <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="url"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="https://youtube.com/watch?v=..."
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
                  field.state.meta.errors.length > 0 ? (
                  <p
                    id={`${field.name}-error`}
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {field.state.meta.errors[0]}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>
        </div>

        {/* Right column: Details (stretches to fill height) */}
        <form.Field
          name="details"
          validators={{
            onChange: ({ value }) =>
              validateLength(value, SUBMISSION_LIMITS.details),
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={field.name}>
                Details <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="Why does this deserve a spot?"
                className="min-h-30 flex-1"
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

      <AnimatedStatus
        show={submitStatus === 'auth-required'}
        className="border-primary/30 bg-primary/5"
        aria-live="polite"
      >
        {submitStatus === 'auth-required' ? (
          <AlertDescription className="text-foreground">
            {isAuthenticated
              ? 'You\u2019re signed in. Click \u201cSubmit Topic\u201d again to confirm your submission.'
              : 'Sign in or create an account to continue. Your draft will stay here.'}
          </AlertDescription>
        ) : null}
      </AnimatedStatus>

      <AnimatedStatus show={submitStatus === 'success'} variant="success" aria-live="polite">
        {submitStatus === 'success' ? (
          <AlertDescription>
            Your topic has been submitted! Thanks for contributing.
          </AlertDescription>
        ) : null}
      </AnimatedStatus>

      <AnimatedStatus show={submitStatus === 'error' && !!submitError} variant="destructive" aria-live="assertive">
        <AlertDescription>{submitError}</AlertDescription>
      </AnimatedStatus>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="self-start"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner data-icon="inline-start" aria-hidden="true" />
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
