import { createClerkClient } from '@clerk/backend'
import { auth } from '@clerk/tanstack-react-start/server'
import { createServerFn } from '@tanstack/react-start'

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

// --- Types ---

export interface AccountEmail {
  id: string
  address: string
  isPrimary: boolean
}

export interface AccountExternalAccount {
  id: string
  provider: string
  email: string | null
  label: string
}

export interface AccountDetails {
  emails: AccountEmail[]
  hasPassword: boolean
  externalAccounts: AccountExternalAccount[]
}

// --- Helpers ---

/** Normalize an OAuth strategy string like "oauth_google" to a display label. */
function providerLabel(provider: string): string {
  const name = provider.replace(/^oauth_/, '')
  return name.charAt(0).toUpperCase() + name.slice(1)
}

// --- Server Functions ---

/**
 * Fetch the current user's account details from Clerk Backend API.
 * Returns emails, password status, and connected OAuth accounts.
 */
export const getAccountDetails = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AccountDetails> => {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const user = await clerkClient.users.getUser(userId)

    const emails: AccountEmail[] = user.emailAddresses.map((email) => ({
      id: email.id,
      address: email.emailAddress,
      isPrimary: email.id === user.primaryEmailAddressId,
    }))

    const hasPassword = user.passwordEnabled

    const externalAccounts: AccountExternalAccount[] =
      user.externalAccounts.map((account) => ({
        id: account.id,
        provider: account.provider,
        email: account.emailAddress ?? null,
        label: providerLabel(account.provider),
      }))

    return { emails, hasPassword, externalAccounts }
  },
)

/**
 * Delete the user's Clerk account. This is irreversible on the Clerk side.
 * The Convex soft-delete should be called separately before this.
 */
export const deleteClerkAccount = createServerFn({ method: 'POST' }).handler(
  async (): Promise<{ deleted: boolean }> => {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    await clerkClient.users.deleteUser(userId)
    return { deleted: true }
  },
)
