import { useState } from 'react'
import { useUser } from '@clerk/tanstack-react-start'
import { EnvelopeSimpleIcon } from '@phosphor-icons/react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx'
import { AnimatedStatus } from '#/components/ui/animatedStatus.tsx'
import { AlertDescription } from '#/components/ui/alert.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import type { AccountEmail } from '#/server/account.ts'

interface EmailSectionProps {
  emails: AccountEmail[]
  onUpdated: () => void
}

type Step = 'display' | 'enter-new' | 'verify'

export function EmailSection({ emails, onUpdated }: EmailSectionProps) {
  const { isLoaded, user } = useUser()
  const primaryEmail = emails.find((e) => e.isPrimary)

  const [step, setStep] = useState<Step>('display')
  const [newEmail, setNewEmail] = useState('')
  const [code, setCode] = useState('')
  const [pendingEmailId, setPendingEmailId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function resetState() {
    setStep('display')
    setNewEmail('')
    setCode('')
    setPendingEmailId(null)
    setError(null)
  }

  async function handleRequestChange() {
    setError(null)
    setSuccess(null)

    const trimmed = newEmail.trim().toLowerCase()

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }

    if (trimmed === primaryEmail?.address) {
      setError('That\u2019s already your current email.')
      return
    }

    if (!isLoaded || !user) {
      setError('Your account is still loading. Please try again.')
      return
    }

    setIsSaving(true)
    try {
      const emailAddress = await user.createEmailAddress({ email: trimmed })
      await emailAddress.prepareVerification({ strategy: 'email_code' })
      setPendingEmailId(emailAddress.id)
      setStep('verify')
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to send verification email.'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleVerify() {
    setError(null)
    setSuccess(null)

    const trimmedCode = code.trim()

    if (!trimmedCode || trimmedCode.length < 4) {
      setError('Please enter the verification code from your email.')
      return
    }

    if (!pendingEmailId) {
      setError('No pending email change. Please start over.')
      return
    }

    if (!isLoaded || !user) {
      setError('Your account is still loading. Please try again.')
      return
    }

    const emailAddress = user.emailAddresses.find(
      (email) => email.id === pendingEmailId,
    )

    if (!emailAddress) {
      setError('That email verification has expired. Please start over.')
      return
    }

    setIsSaving(true)
    try {
      const verifiedEmail = await emailAddress.attemptVerification({
        code: trimmedCode,
      })
      if (verifiedEmail.verification.status !== 'verified') {
        throw new Error('Verification failed. Please check the code and try again.')
      }
      await user.update({ primaryEmailAddressId: verifiedEmail.id })
      setSuccess('Email updated successfully.')
      resetState()
      onUpdated()
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Verification failed. Please check the code and try again.'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EnvelopeSimpleIcon className="size-5" aria-hidden="true" />
          Email Address
        </CardTitle>
        <CardDescription>
          Your email is used for sign-in and notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-4">
        {/* Current email display */}
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Current email</span>
          <span className="text-sm font-medium">
            {primaryEmail?.address ?? 'No email on file'}
          </span>
        </div>

        {/* Step: display — show change button */}
        {step === 'display' && (
          <Button
            variant="outline"
            className="self-start"
            onClick={() => {
              setError(null)
              setSuccess(null)
              setStep('enter-new')
            }}
          >
            Change email
          </Button>
        )}

        {/* Step: enter new email */}
        {step === 'enter-new' && (
          <div className="flex flex-col gap-3 border-t pt-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-new-email">New email address</Label>
              <Input
                id="settings-new-email"
                type="email"
                placeholder="you@example.com"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value)
                  if (error) setError(null)
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'email-change-error' : undefined}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRequestChange}
                disabled={isSaving}
                className="self-start"
              >
                {isSaving ? 'Sending\u2026' : 'Send verification code'}
              </Button>
              <Button
                variant="ghost"
                onClick={resetState}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Step: verify code */}
        {step === 'verify' && (
          <div className="flex flex-col gap-3 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              We sent a verification code to{' '}
              <span className="font-medium text-foreground">
                {newEmail.trim().toLowerCase()}
              </span>
              . Enter it below to confirm the change.
            </p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-email-code">Verification code</Label>
              <Input
                id="settings-email-code"
                type="text"
                inputMode="numeric"
                placeholder="Enter code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  if (error) setError(null)
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'email-change-error' : undefined}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleVerify}
                disabled={isSaving}
                className="self-start"
              >
                {isSaving ? 'Verifying\u2026' : 'Verify & update'}
              </Button>
              <Button
                variant="ghost"
                onClick={resetState}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Error message */}
        <AnimatedStatus show={!!error} variant="destructive" aria-live="assertive">
          <AlertDescription id="email-change-error">{error}</AlertDescription>
        </AnimatedStatus>

        {/* Success message */}
        <AnimatedStatus show={!!success} variant="success" aria-live="polite">
          <AlertDescription>{success}</AlertDescription>
        </AnimatedStatus>
      </CardContent>
    </Card>
  )
}
