import { useState } from 'react'
import { SignInButton, useAuth } from '@clerk/tanstack-react-start'
import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert.tsx'
import { Button } from '#/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx'
import { Label } from '#/components/ui/label.tsx'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import { Spinner } from '#/components/ui/spinner.tsx'
import { Textarea } from '#/components/ui/textarea.tsx'
import { ENABLE_AUTH, ENABLE_TEST_FEEDBACK } from '#/lib/featureFlags'

import { api } from '#convex/_generated/api'
import { FEEDBACK_MESSAGE_MAX_LENGTH } from '#shared/constants'

const feedbackCategories = [
  { value: 'bug', label: 'Bug report' },
  { value: 'idea', label: 'Idea' },
  { value: 'general', label: 'General feedback' },
] as const

type FeedbackCategory = (typeof feedbackCategories)[number]['value']

function isFeedbackCategory(value: string | null): value is FeedbackCategory {
  return feedbackCategories.some((category) => category.value === value)
}

export const Route = createFileRoute('/_app/feedback')({
  beforeLoad: () => {
    if (!ENABLE_AUTH || !ENABLE_TEST_FEEDBACK) {
      throw redirect({ to: '/' })
    }
  },
  head: () => ({
    meta: [{ title: 'Beta Feedback | Bullshit Corner' }],
  }),
  component: FeedbackPage,
})

function FeedbackPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const [category, setCategory] = useState<FeedbackCategory>('general')
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const feedbackMutation = useMutation({
    mutationFn: useConvexMutation(api.feedback.create),
    onSuccess: () => {
      setMessage('')
      setFormError(null)
      setSubmitted(true)
    },
    onError: () => {
      setFormError('We could not save your feedback. Please try again.')
    },
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(false)

    const trimmedMessage = message.trim()
    if (trimmedMessage.length === 0) {
      setFormError('Please tell us what you think.')
      return
    }
    if (trimmedMessage.length > FEEDBACK_MESSAGE_MAX_LENGTH) {
      setFormError(
        `Feedback must be ${FEEDBACK_MESSAGE_MAX_LENGTH} characters or fewer.`,
      )
      return
    }

    setFormError(null)
    feedbackMutation.mutate({
      category,
      message: trimmedMessage,
      pagePath: window.location.pathname,
    })
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-8 text-primary" aria-label="Loading feedback" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Share beta feedback</CardTitle>
          <CardDescription>
            Sign in to send feedback that we can follow up on.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInButton mode="modal">
            <Button>Sign in to share feedback</Button>
          </SignInButton>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Share beta feedback</CardTitle>
        <CardDescription>
          Tell us what worked, what didn’t, or what you’d change. Please do not
          include sensitive or personal information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="feedback-category">Feedback type</Label>
            <Select
              items={feedbackCategories}
              value={category}
              onValueChange={(value) => {
                if (isFeedbackCategory(value)) setCategory(value)
              }}
            >
              <SelectTrigger id="feedback-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {feedbackCategories.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="feedback-message">Your feedback</Label>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="What would make Bullshit Corner better?"
              className="min-h-36"
              maxLength={FEEDBACK_MESSAGE_MAX_LENGTH + 50}
              aria-invalid={formError ? true : undefined}
              aria-describedby={formError ? 'feedback-error' : 'feedback-hint'}
              disabled={feedbackMutation.isPending}
            />
            <p id="feedback-hint" className="text-xs text-muted-foreground">
              {message.length}/{FEEDBACK_MESSAGE_MAX_LENGTH} characters
            </p>
          </div>

          {formError && (
            <Alert variant="destructive" aria-live="assertive">
              <AlertTitle>Feedback not sent</AlertTitle>
              <AlertDescription id="feedback-error">
                {formError}
              </AlertDescription>
            </Alert>
          )}

          {submitted && (
            <Alert variant="success" aria-live="polite">
              <AlertTitle>Thank you</AlertTitle>
              <AlertDescription>
                Your beta feedback has been saved.
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="self-start"
            disabled={feedbackMutation.isPending}
            aria-busy={feedbackMutation.isPending}
          >
            {feedbackMutation.isPending ? (
              <>
                <Spinner data-icon="inline-start" aria-hidden="true" />
                Sending…
              </>
            ) : (
              'Send feedback'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
