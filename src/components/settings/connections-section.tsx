import { useState } from 'react'
import { useUser } from '@clerk/tanstack-react-start'
import {
  LinkIcon,
  LinkBreakIcon,
  GoogleLogoIcon,
  GithubLogoIcon,
  AppleLogoIcon,
  MicrosoftOutlookLogoIcon,
  GlobeIcon,
  PlusIcon,
  WarningIcon,
} from '@phosphor-icons/react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx'
import { Button } from '#/components/ui/button.tsx'

import type { AccountExternalAccount } from '#/server/account.ts'

/** Supported OAuth strategies for connecting new accounts. */
const AVAILABLE_PROVIDERS = [
  { strategy: 'oauth_google', label: 'Google', icon: GoogleLogoIcon },
  { strategy: 'oauth_github', label: 'GitHub', icon: GithubLogoIcon },
  { strategy: 'oauth_apple', label: 'Apple', icon: AppleLogoIcon },
  {
    strategy: 'oauth_microsoft',
    label: 'Microsoft',
    icon: MicrosoftOutlookLogoIcon,
  },
] as const

function getProviderIcon(provider: string) {
  switch (provider) {
    case 'oauth_google':
    case 'google':
      return GoogleLogoIcon
    case 'oauth_github':
    case 'github':
      return GithubLogoIcon
    case 'oauth_apple':
    case 'apple':
      return AppleLogoIcon
    case 'oauth_microsoft':
    case 'microsoft':
      return MicrosoftOutlookLogoIcon
    default:
      return GlobeIcon
  }
}

interface ConnectionsSectionProps {
  externalAccounts: AccountExternalAccount[]
  hasPassword: boolean
  onUpdated: () => void
}

export function ConnectionsSection({
  externalAccounts,
  hasPassword,
  onUpdated,
}: ConnectionsSectionProps) {
  const { user } = useUser()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const connectedProviders = new Set(
    externalAccounts.map((a) => a.provider),
  )

  // Determine if disconnecting is safe (user must have another auth method)
  const canDisconnect = hasPassword || externalAccounts.length > 1

  async function handleDisconnect(accountId: string, label: string) {
    if (!user) return
    setError(null)
    setSuccess(null)

    if (!canDisconnect) {
      setError(
        'Cannot disconnect your only sign-in method. Set a password first or connect another account.',
      )
      return
    }

    setLoadingAction(`disconnect-${accountId}`)
    try {
      const externalAccount = user.externalAccounts.find(
        (a) => a.id === accountId,
      )
      if (!externalAccount) {
        throw new Error('Account not found. Please refresh and try again.')
      }
      await externalAccount.destroy()
      setSuccess(`${label} disconnected.`)
      onUpdated()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to disconnect account.'
      setError(message)
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleConnect(strategy: string, label: string) {
    if (!user) return
    setError(null)
    setSuccess(null)
    setLoadingAction(`connect-${strategy}`)

    try {
      const result = await user.createExternalAccount({
        strategy: strategy as Parameters<typeof user.createExternalAccount>[0]['strategy'],
        redirectUrl: window.location.href,
      })

      // The createExternalAccount call returns a verification object with an
      // externalVerificationRedirectURL that we need to navigate to.
      const redirectUrl =
        result.verification?.externalVerificationRedirectURL
      if (redirectUrl) {
        window.location.href = redirectUrl.toString()
      } else {
        // If already verified (unlikely for new connections), just refresh
        setSuccess(`${label} connected.`)
        onUpdated()
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : `Failed to connect ${label}.`
      setError(message)
      setLoadingAction(null)
    }
  }

  // Providers not yet connected
  const availableToConnect = AVAILABLE_PROVIDERS.filter(
    (p) => !connectedProviders.has(p.strategy) && !connectedProviders.has(p.strategy.replace('oauth_', '')),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="size-5" aria-hidden="true" />
          Connected Accounts
        </CardTitle>
        <CardDescription>
          Manage your linked sign-in providers. You can connect multiple
          accounts for easier access.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Connected accounts list */}
        {externalAccounts.length > 0 ? (
          <ul className="flex flex-col gap-3" role="list">
            {externalAccounts.map((account) => {
              const Icon = getProviderIcon(account.provider)
              const isLoading = loadingAction === `disconnect-${account.id}`

              return (
                <li
                  key={account.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {account.label}
                      </span>
                      {account.email && (
                        <span className="text-xs text-muted-foreground">
                          {account.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(account.id, account.label)}
                    disabled={isLoading || !canDisconnect}
                    aria-label={`Disconnect ${account.label}`}
                  >
                    {isLoading ? (
                      'Removing\u2026'
                    ) : (
                      <>
                        <LinkBreakIcon className="size-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Disconnect</span>
                      </>
                    )}
                  </Button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No connected accounts.
          </p>
        )}

        {/* Safety warning when disconnect is blocked */}
        {!canDisconnect && externalAccounts.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900/50 dark:bg-amber-950/30">
            <WarningIcon
              className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              You can&apos;t disconnect your only sign-in method. Set a password
              or connect another account first.
            </p>
          </div>
        )}

        {/* Connect new providers */}
        {availableToConnect.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <span className="text-sm font-medium">Connect another account</span>
            <div className="flex flex-wrap gap-2">
              {availableToConnect.map(({ strategy, label, icon: Icon }) => {
                const isLoading = loadingAction === `connect-${strategy}`
                return (
                  <Button
                    key={strategy}
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnect(strategy, label)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      'Connecting\u2026'
                    ) : (
                      <>
                        <Icon className="size-4" aria-hidden="true" />
                        <PlusIcon className="size-3" aria-hidden="true" />
                        {label}
                      </>
                    )}
                  </Button>
                )
              })}
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
