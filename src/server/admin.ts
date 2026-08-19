import { createClerkClient } from '@clerk/backend'
import { auth } from '@clerk/tanstack-react-start/server'
import { createServerFn } from '@tanstack/react-start'

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

// --- Types ---

export interface AdminUser {
  id: string
  firstName: string | null
  lastName: string | null
  imageUrl: string
  email: string | null
  role: string | null
}

// --- Helpers ---

/**
 * Verify the caller is an authenticated admin. Returns the caller's userId.
 * Throws if not authenticated or not an admin.
 */
async function requireAdmin(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const user = await clerkClient.users.getUser(userId)
  const role = (user.publicMetadata as Record<string, unknown>)?.role
  if (role !== 'admin') throw new Error('Forbidden')

  return userId
}

/** Map a Clerk user object to our simplified AdminUser shape. */
function toAdminUser(user: {
  id: string
  firstName: string | null
  lastName: string | null
  imageUrl: string
  emailAddresses: Array<{ emailAddress: string; id: string }>
  primaryEmailAddressId: string | null
  publicMetadata: Record<string, unknown>
}): AdminUser {
  const primaryEmail = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId,
  )
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    email: primaryEmail?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null,
    role: (user.publicMetadata?.role as string) ?? null,
  }
}

// --- Server Functions ---

/**
 * Search users by a partial email query string.
 * Returns up to 10 matching users.
 */
export const searchUsers = createServerFn({ method: 'GET' })
  .validator((data: { query: string }) => data)
  .handler(async ({ data }): Promise<AdminUser[]> => {
    await requireAdmin()

    const { query } = data
    if (!query || query.trim().length < 2) return []

    const users = await clerkClient.users.getUserList({
      query: query.trim(),
      limit: 10,
    })

    return users.data.map((u) =>
      toAdminUser(u as unknown as Parameters<typeof toAdminUser>[0]),
    )
  })

/**
 * List all users who currently have the admin role.
 * Since Clerk doesn't support filtering by metadata via the list API,
 * we fetch a reasonable batch and filter server-side.
 * This works well for a small number of admins.
 */
export const listAdminUsers = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AdminUser[]> => {
    await requireAdmin()

    // Fetch users in batches to find admins. In practice admin count is small,
    // but we paginate to be safe.
    const admins: AdminUser[] = []
    let offset = 0
    const limit = 100

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const batch = await clerkClient.users.getUserList({ limit, offset })
      for (const u of batch.data) {
        const role = (u.publicMetadata as Record<string, unknown>)?.role
        if (role === 'admin') {
          admins.push(
            toAdminUser(u as unknown as Parameters<typeof toAdminUser>[0]),
          )
        }
      }

      // If we got fewer than `limit`, we've reached the end
      if (batch.data.length < limit) break
      offset += limit

      // Safety cap — don't iterate forever
      if (offset > 1000) break
    }

    return admins
  },
)

/**
 * Set or remove the admin role for a target user.
 * - role: 'admin' to grant, null to revoke.
 * - Self-removal is blocked (caller cannot remove their own admin role).
 * - Preserves existing publicMetadata fields via spread.
 */
export const setUserRole = createServerFn({ method: 'POST' })
  .validator((data: { userId: string; role: 'admin' | null }) => data)
  .handler(
    async ({ data }): Promise<{ success: boolean }> => {
      const callerId = await requireAdmin()

      const { userId, role } = data

      // Prevent self-removal
      if (!role && userId === callerId) {
        throw new Error('Cannot remove your own admin role')
      }

      // Read current metadata to avoid overwriting other fields
      const targetUser = await clerkClient.users.getUser(userId)
      const currentMetadata =
        (targetUser.publicMetadata as Record<string, unknown>) ?? {}

      let updatedMetadata: Record<string, unknown>
      if (role) {
        updatedMetadata = { ...currentMetadata, role }
      } else {
        // Remove the role key while preserving everything else
        const { role: _removed, ...rest } = currentMetadata
        updatedMetadata = rest
      }

      await clerkClient.users.updateUser(userId, {
        publicMetadata: updatedMetadata,
      })

      return { success: true }
    },
  )
