import { useState } from 'react'
import { useUser } from '@clerk/tanstack-react-start'
import { LockIcon, CheckCircleIcon } from '@phosphor-icons/react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'

const MIN_PASSWORD_LENGTH = 8

interface PasswordSectionProps {
  hasPassword: boolean
}

export function PasswordSection({ hasPassword }: PasswordSectionProps) {
  const { user } = useUser()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  function resetForm() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    setIsEditing(false)
  }

  async function handleSubmit() {
    setError(null)
    setSuccess(null)

    if (!user) {
      setError('User session not available. Please refresh the page.')
      return
    }

    // Validate new password
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    // If user has a password, current password is required
    if (hasPassword && !currentPassword) {
      setError('Please enter your current password.')
      return
    }

    setIsSaving(true)
    try {
      if (hasPassword) {
        await user.updatePassword({
          currentPassword,
          newPassword,
          signOutOfOtherSessions: true,
        })
      } else {
        await user.updatePassword({
          newPassword,
          signOutOfOtherSessions: false,
        })
      }
      setSuccess(
        hasPassword
          ? 'Password updated. Other sessions have been signed out.'
          : 'Password set successfully. You can now sign in with your email and password.',
      )
      resetForm()
    } catch (e) {
      let message = 'Failed to update password. Please try again.'
      if (e instanceof Error) {
        // Clerk errors often have a readable message
        if (e.message.includes('incorrect')) {
          message = 'Current password is incorrect.'
        } else if (e.message.includes('weak') || e.message.includes('pwned')) {
          message =
            'That password is too common or weak. Please choose a stronger one.'
        } else if (e.message) {
          message = e.message
        }
      }
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LockIcon className="size-5" aria-hidden="true" />
          Password
        </CardTitle>
        <CardDescription>
          {hasPassword
            ? 'Change your password to keep your account secure.'
            : 'Set a password so you can sign in with your email and password in addition to your connected accounts.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Status indicator */}
        {hasPassword && !isEditing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircleIcon
              className="size-4 text-green-600 dark:text-green-400"
              aria-hidden="true"
            />
            Password is set
          </div>
        )}

        {/* Show form toggle */}
        {!isEditing && (
          <Button
            variant="outline"
            className="self-start"
            onClick={() => {
              setError(null)
              setSuccess(null)
              setIsEditing(true)
            }}
          >
            {hasPassword ? 'Change password' : 'Set a password'}
          </Button>
        )}

        {/* Password form */}
        {isEditing && (
          <div className="flex flex-col gap-4 border-t border-border pt-4">
            {/* Current password — only if user already has one */}
            {hasPassword && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="settings-current-password">
                  Current password
                </Label>
                <Input
                  id="settings-current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    if (error) setError(null)
                  }}
                  aria-invalid={
                    error?.includes('current') || error?.includes('incorrect')
                      ? true
                      : undefined
                  }
                  disabled={isSaving}
                />
              </div>
            )}

            {/* New password */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-new-password">New password</Label>
              <Input
                id="settings-new-password"
                type="password"
                autoComplete="new-password"
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (error) setError(null)
                }}
                aria-invalid={
                  error?.includes('least') || error?.includes('weak')
                    ? true
                    : undefined
                }
                aria-describedby="password-hint"
                disabled={isSaving}
              />
              <p id="password-hint" className="text-xs text-muted-foreground">
                Must be at least {MIN_PASSWORD_LENGTH} characters.
              </p>
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-confirm-password">
                Confirm new password
              </Label>
              <Input
                id="settings-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (error) setError(null)
                }}
                aria-invalid={
                  error?.includes('match') ? true : undefined
                }
                disabled={isSaving}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="self-start"
              >
                {isSaving
                  ? 'Saving\u2026'
                  : hasPassword
                    ? 'Update password'
                    : 'Set password'}
              </Button>
              <Button
                variant="ghost"
                onClick={resetForm}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Success */}
        {success && (
          <p role="status" className="text-sm text-green-600 dark:text-green-400">
            {success}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
