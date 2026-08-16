/**
 * Convex Auth Helper — Role-Based Access Control
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * REQUIRED MANUAL SETUP — Clerk Dashboard Session Token Customization
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * For RBAC to work, a custom claim must be added to the Clerk session token
 * so that the user's role (stored in Clerk publicMetadata) is propagated to
 * Convex via the JWT.
 *
 * Steps:
 *   1. Go to Clerk Dashboard → JWT Templates → convex template
 *   2. Add the following JSON to the custom claims editor:
 *
 *      {
 *        "metadata": "{{user.public_metadata}}"
 *      }
 *
 *   3. Save the session token configuration.
 *
 * This maps the user's entire `publicMetadata` object (which includes the
 * `role` field) into the JWT under a `metadata` key. On the Convex side,
 * `ctx.auth.getUserIdentity()` exposes this as a custom claim accessible
 * via `(identity as any).metadata?.role`.
 *
 * Role assignment:
 *   - Set `publicMetadata.role` to `"admin"` in the Clerk Dashboard (Users →
 *     select user → Metadata → Public) to grant admin access.
 *   - If `publicMetadata.role` is absent, undefined, null, or any unrecognised
 *     value, the user is treated as a General User.
 *
 * Note: Clerk's Convex integration already sets `aud: "convex"` by default.
 * The custom claims editor simply adds the `metadata` shortcode on top of the
 * existing configuration.
 *
 * Role changes in Clerk's dashboard propagate on the next token refresh (~60s)
 * with zero code deploys.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { ConvexError } from 'convex/values'

import type { MutationCtx, QueryCtx } from '../_generated/server'

type AuthCtx = QueryCtx | MutationCtx

/**
 * Verifies the caller is authenticated and has the "admin" role.
 * Throws distinguishable ConvexErrors for unauthenticated vs unauthorized.
 *
 * Returns the identity on success so callers can use it (e.g. to look up
 * the admin's user record for audit fields like `chosenBy`).
 */
export async function requireAdmin(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity()

  if (!identity) {
    throw new ConvexError({
      code: 'UNAUTHENTICATED',
      message: 'Sign in required.',
    })
  }

  const role = (identity as any).metadata?.role
  if (role !== 'admin') {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Admin access required.',
    })
  }

  return identity
}


