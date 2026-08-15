import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useConvexAuth, useMutation } from 'convex/react'

import { useCurrentUser } from '#/hooks/use-current-user.ts'
import { ENABLE_AUTH } from '#/lib/feature-flags.ts'
import { SiteHeader } from '#/components/site-header.tsx'
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
import { Switch } from '#/components/ui/switch.tsx'
import { Skeleton } from '#/components/ui/skeleton.tsx'
import {
  SettingsLayoutSidebar,
  type SettingsSection,
} from '#/components/settings/settings-layout-sidebar.tsx'
import { EmailSection } from '#/components/settings/email-section.tsx'
import { PasswordSection } from '#/components/settings/password-section.tsx'
import { ConnectionsSection } from '#/components/settings/connections-section.tsx'
import { DeleteAccountSection } from '#/components/settings/delete-account-section.tsx'
import { getAccountDetails } from '#/server/account.ts'

import { api } from '../../convex/_generated/api'

import type { AccountDetails } from '#/server/account.ts'

/** Client-side mirror of convex/constants.ts (can't import across runtime boundary). */
const DISPLAY_NAME_MAX_LENGTH = 50

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()
  const { user, isLoading: isUserLoading } = useCurrentUser()
  const updateProfile = useMutation(api.users.updateProfile)

  const [displayName, setDisplayName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Account details from Clerk Backend API
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(
    null,
  )
  const [accountLoading, setAccountLoading] = useState(true)
  const [accountError, setAccountError] = useState<string | null>(null)

  const isLoading = isAuthLoading || isUserLoading

  // Fetch account details from Clerk
  const fetchAccountDetails = useCallback(async () => {
    setAccountLoading(true)
    setAccountError(null)
    try {
      const details = await getAccountDetails()
      setAccountDetails(details)
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Failed to load account details.'
      setAccountError(message)
    } finally {
      setAccountLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      void fetchAccountDetails()
    }
  }, [isAuthenticated, isAuthLoading, fetchAccountDetails])

  // Sync local state with user data once loaded
  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name)
    }
  }, [user?.name])

  // Route guard: redirect if auth disabled or not authenticated
  useEffect(() => {
    if (!ENABLE_AUTH) {
      void navigate({ to: '/' })
      return
    }

    if (!isAuthLoading && !isAuthenticated) {
      void navigate({ to: '/' })
    }
  }, [isAuthLoading, isAuthenticated, navigate])

  // --- Identity & Privacy handlers (unchanged) ---

  async function handleSaveName() {
    setNameError(null)
    setSuccessMessage(null)
    setToggleError(null)

    const trimmed = displayName.trim()

    if (trimmed.length === 0) {
      setNameError('Display name is required.')
      return
    }

    if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
      setNameError('Display name must be 50 characters or fewer.')
      return
    }

    setIsSaving(true)
    try {
      await updateProfile({ name: trimmed, alwaysAnonymous: false })
      setSuccessMessage(
        'Display name saved. Your submissions will show this name.',
      )
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Something went wrong. Please try again.'
      setNameError(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleAnonymous(checked: boolean) {
    setToggleError(null)
    setSuccessMessage(null)
    setNameError(null)

    if (checked) {
      setIsSaving(true)
      try {
        await updateProfile({ alwaysAnonymous: true })
        setSuccessMessage(
          'Anonymous mode enabled. Your submissions will appear as "Anonymous".',
        )
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Something went wrong. Please try again.'
        setToggleError(message)
      } finally {
        setIsSaving(false)
      }
    } else {
      const currentName = displayName.trim() || (user!.name ?? '')

      if (!currentName) {
        setToggleError('Please set a display name first.')
        return
      }

      setIsSaving(true)
      try {
        await updateProfile({ alwaysAnonymous: false })
        setSuccessMessage(
          'Anonymous mode disabled. Your submissions will show your display name.',
        )
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Something went wrong. Please try again.'
        setToggleError(message)
      } finally {
        setIsSaving(false)
      }
    }
  }

  // --- Early returns ---

  if (!ENABLE_AUTH) {
    return null
  }

  if (isLoading) {
    return null
  }

  if (!user) {
    return null
  }

  // --- Build sections array for the layout switcher ---

  const sections: SettingsSection[] = [
    {
      id: 'identity',
      label: 'Identity & Privacy',
      content: (
        <IdentitySection
          user={user}
          displayName={displayName}
          setDisplayName={setDisplayName}
          nameError={nameError}
          setNameError={setNameError}
          successMessage={successMessage}
          setSuccessMessage={setSuccessMessage}
          toggleError={toggleError}
          isSaving={isSaving}
          onSaveName={handleSaveName}
          onToggleAnonymous={handleToggleAnonymous}
        />
      ),
    },
    {
      id: 'email',
      label: 'Email',
      content: accountLoading ? (
        <SettingsSkeleton />
      ) : accountError ? (
        <SettingsError message={accountError} onRetry={fetchAccountDetails} />
      ) : (
        <EmailSection
          emails={accountDetails!.emails}
          onUpdated={fetchAccountDetails}
        />
      ),
    },
    {
      id: 'password',
      label: 'Password',
      content: accountLoading ? (
        <SettingsSkeleton />
      ) : accountError ? (
        <SettingsError message={accountError} onRetry={fetchAccountDetails} />
      ) : (
        <PasswordSection hasPassword={accountDetails!.hasPassword} />
      ),
    },
    {
      id: 'connections',
      label: 'Connected Accounts',
      content: accountLoading ? (
        <SettingsSkeleton />
      ) : accountError ? (
        <SettingsError message={accountError} onRetry={fetchAccountDetails} />
      ) : (
        <ConnectionsSection
          externalAccounts={accountDetails!.externalAccounts}
          hasPassword={accountDetails!.hasPassword}
          onUpdated={fetchAccountDetails}
        />
      ),
    },
    {
      id: 'delete',
      label: 'Delete Account',
      content: <DeleteAccountSection />,
    },
  ]

  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold">Settings</h1>
        <SettingsLayoutSidebar sections={sections} />
      </div>
    </>
  )
}

// --- Sub-components extracted for readability ---

interface IdentitySectionProps {
  user: { alwaysAnonymous?: boolean; name?: string }
  displayName: string
  setDisplayName: (value: string) => void
  nameError: string | null
  setNameError: (value: string | null) => void
  successMessage: string | null
  setSuccessMessage: (value: string | null) => void
  toggleError: string | null
  isSaving: boolean
  onSaveName: () => void
  onToggleAnonymous: (checked: boolean) => void
}

function IdentitySection({
  user,
  displayName,
  setDisplayName,
  nameError,
  setNameError,
  successMessage,
  setSuccessMessage,
  toggleError,
  isSaving,
  onSaveName,
  onToggleAnonymous,
}: IdentitySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity &amp; Privacy</CardTitle>
        <CardDescription>
          Choose how you appear on submissions. You can either use a display
          name or stay anonymous — enabling anonymous mode overrides your
          display name.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Anonymous toggle */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Switch
              id="settings-always-anonymous"
              checked={user.alwaysAnonymous === true}
              onCheckedChange={onToggleAnonymous}
              disabled={isSaving}
              aria-describedby={
                toggleError ? 'settings-toggle-error' : undefined
              }
            />
            <Label htmlFor="settings-always-anonymous">
              Always submit anonymously
            </Label>
          </div>
          {toggleError && (
            <p
              id="settings-toggle-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {toggleError}
            </p>
          )}
        </div>

        {/* Display name input — shown when not anonymous */}
        {user.alwaysAnonymous !== true && (
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-display-name">Display Name</Label>
              <Input
                id="settings-display-name"
                type="text"
                placeholder="Enter your display name"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                  if (nameError) setNameError(null)
                  if (successMessage) setSuccessMessage(null)
                }}
                maxLength={DISPLAY_NAME_MAX_LENGTH + 10}
                aria-invalid={nameError ? true : undefined}
                aria-describedby={
                  nameError ? 'settings-name-error' : undefined
                }
                disabled={isSaving}
              />
              {nameError && (
                <p
                  id="settings-name-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {nameError}
                </p>
              )}
            </div>

            <Button
              onClick={onSaveName}
              disabled={isSaving}
              className="self-start"
            >
              {isSaving ? 'Saving\u2026' : 'Save Name'}
            </Button>
          </div>
        )}

        {/* Shared success message */}
        {successMessage && (
          <p
            role="status"
            className="text-sm text-green-600 dark:text-green-400"
          >
            {successMessage}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function SettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  )
}

function SettingsError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-8">
        <p className="text-sm text-destructive">{message}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}
