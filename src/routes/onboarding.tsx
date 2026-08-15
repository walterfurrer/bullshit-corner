import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from 'convex/react'

import { useCurrentUser } from '#/hooks/use-current-user.ts'
import { ENABLE_AUTH } from '#/lib/feature-flags.ts'
import { Button } from '#/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'

import { api } from '../../convex/_generated/api'

/** Client-side mirror of convex/constants.ts (can't import across runtime boundary). */
const DISPLAY_NAME_MAX_LENGTH = 50

export const Route = createFileRoute('/onboarding')({
  head: () => ({
    meta: [{ title: 'Welcome | Bullshit Corner' }],
  }),
  component: OnboardingPage,
})

function OnboardingPage() {
  const navigate = useNavigate()
  const { user, needsOnboarding, isLoading } = useCurrentUser()
  const updateProfile = useMutation(api.users.updateProfile)

  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Route guard: redirect if auth is disabled or user doesn't need onboarding
  useEffect(() => {
    if (!ENABLE_AUTH) {
      void navigate({ to: '/' })
      return
    }

    if (!isLoading && user && !needsOnboarding) {
      void navigate({ to: '/' })
    }
  }, [isLoading, user, needsOnboarding, navigate])

  if (!ENABLE_AUTH) {
    return null
  }

  if (isLoading) {
    return null
  }

  if (success) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">You&rsquo;re all set!</CardTitle>
            <CardDescription>
              Your preference has been saved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link to="/" />} nativeButton={false} className="w-full">Continue to Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  async function handleSaveName() {
    setError(null)

    const trimmed = displayName.trim()

    if (trimmed.length === 0) {
      setError('Display name is required.')
      return
    }

    if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
      setError('Display name must be 50 characters or fewer.')
      return
    }

    setIsSubmitting(true)
    try {
      await updateProfile({ name: trimmed, alwaysAnonymous: false })
      setSuccess(true)
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleStayAnonymous() {
    setError(null)
    setIsSubmitting(true)
    try {
      await updateProfile({ alwaysAnonymous: true })
      setSuccess(true)
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Welcome to Bullshit Corner</CardTitle>
          <CardDescription>
            Choose a display name for your submissions, or stay anonymous.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              type="text"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value)
                if (error) setError(null)
              }}
              maxLength={DISPLAY_NAME_MAX_LENGTH + 10}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'name-error' : undefined}
              disabled={isSubmitting}
            />
            {error && (
              <p
                id="name-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSaveName}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : 'Save Name'}
            </Button>

            <Button
              variant="outline"
              onClick={handleStayAnonymous}
              disabled={isSubmitting}
            >
              Stay Anonymous
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
