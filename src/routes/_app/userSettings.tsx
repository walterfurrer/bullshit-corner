import { auth } from '@clerk/tanstack-react-start/server'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { useConvexAuth } from 'convex/react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'

import { ConnectionsSection } from '#/components/settings/connectionsSection'
import { DeleteAccountSection } from '#/components/settings/deleteAccountSection'
import { EmailSection } from '#/components/settings/emailSection'
import { PasswordSection } from '#/components/settings/passwordSection'
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
import { Skeleton } from '#/components/ui/skeleton.tsx'
import { Switch } from '#/components/ui/switch.tsx'
import { useCurrentUser } from '#/hooks/useCurrentUser.ts'
import { useSyncToClerk } from '#/hooks/useSyncToClerk.ts'
import { ENABLE_AUTH } from '#/lib/featureFlags'
import { cn } from '#/lib/utils.ts'
import { getAccountDetails } from '#/server/account.ts'

import { api } from '#convex/_generated/api'

import type { AccountDetails } from '#/server/account.ts'

import { DISPLAY_NAME_MAX_LENGTH } from '#shared/constants'

export const Route = createFileRoute('/_app/userSettings')({
  head: () => ({
    meta: [{ title: 'Settings | Bullshit Corner' }],
  }),
  beforeLoad: async () => {
    if (!ENABLE_AUTH) {
      throw redirect({ to: '/' })
    }

    if (typeof window === 'undefined') {
      const { userId } = await auth()
      if (!userId) {
        throw redirect({ to: '/' })
      }
    }
  },
  component: SettingsPage,
})

// ---------------------------------------------------------------------------
// Settings Layout (sidebar nav + content panel)
// ---------------------------------------------------------------------------

interface SettingsSection {
  id: string
  label: string
  content: ReactNode
}

function SettingsLayout({ sections }: { sections: SettingsSection[] }) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? '')

  // Sync activeSection if sections change and current is gone
  useEffect(() => {
    if (sections.length > 0 && !sections.some((s) => s.id === activeSection)) {
      setActiveSection(sections[0].id)
    }
  }, [sections, activeSection])

  const activeContent = sections.find((s) => s.id === activeSection)?.content

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-8">
      {/* Sidebar — vertical on desktop, horizontal scroll on mobile */}
      <nav aria-label="Settings sections" className="section-nav">
        <ul className="section-nav-list">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'section-nav-item',
                  activeSection === section.id && 'section-nav-item-active',
                )}
                aria-current={activeSection === section.id ? 'page' : undefined}
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content area */}
      <div className="min-w-0 flex-1">{activeContent}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Settings Page
// ---------------------------------------------------------------------------

function SettingsPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()
  const { user, isLoading: isUserLoading } = useCurrentUser()
  const { syncName } = useSyncToClerk()

  const updateProfileMutation = useMutation({
    mutationFn: useConvexMutation(api.users.updateProfile),
  })

  const [displayName, setDisplayName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)

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

  // --- Identity & Privacy handlers ---

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

    try {
      await updateProfileMutation.mutateAsync({ name: trimmed, alwaysAnonymous: false })
      void syncName(trimmed)
      setSuccessMessage(
        'Display name saved. Your submissions will show this name.',
      )
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Something went wrong. Please try again.'
      setNameError(message)
    }
  }

  async function handleToggleAnonymous(checked: boolean) {
    setToggleError(null)
    setSuccessMessage(null)
    setNameError(null)

    if (checked) {
      try {
        await updateProfileMutation.mutateAsync({ alwaysAnonymous: true })
        void syncName(undefined)
        setSuccessMessage(
          'Anonymous mode enabled. Your submissions will appear as "Anonymous".',
        )
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Something went wrong. Please try again.'
        setToggleError(message)
      }
    } else {
      const currentName = displayName.trim() || (user!.name ?? '')

      if (!currentName) {
        setToggleError('Please set a display name first.')
        return
      }

      try {
        await updateProfileMutation.mutateAsync({ alwaysAnonymous: false })
        void syncName(currentName)
        setSuccessMessage(
          'Anonymous mode disabled. Your submissions will show your display name.',
        )
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Something went wrong. Please try again.'
        setToggleError(message)
      }
    }
  }

  // --- Early returns ---

  if (isLoading) {
    return null
  }

  if (!user) {
    return null
  }

  // --- Build sections array for the layout ---

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
          isSaving={updateProfileMutation.isPending}
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
      <h1 className="mb-4">Settings</h1>
      <SettingsLayout sections={sections} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

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
      <CardContent className="gap-6">
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
          <div className="flex flex-col gap-3 border-t pt-4">
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
          <p role="status" className="text-sm text-success">
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
      <CardContent className="gap-4">
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
      <CardContent className="items-center py-8">
        <p className="text-sm text-destructive">{message}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}
