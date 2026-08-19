/// <reference types="vite/client" />

import rateLimiterTest from '@convex-dev/rate-limiter/test'
import { convexTest } from 'convex-test'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { api } from '../_generated/api'
import schema from '../schema'

// convex-test resolves modules relative to the convex/ root.
// Glob from admin/ needs to include both sibling files (../*.ts) and
// its own directory (../admin/*.ts). Vite's glob from a subdirectory
// excludes the subdirectory itself, so we use two patterns merged.
const parentModules = import.meta.glob('../**/*.ts')
const localModules = import.meta.glob('./**/*.ts')
const modules = Object.fromEntries([
  ...Object.entries(parentModules).map(([key, value]) => [
    key.replace(/^\.\.\//, './'),
    value,
  ]),
  ...Object.entries(localModules).map(([key, value]) => [
    `./admin${key.slice(1)}`,
    value,
  ]),
])

const adminIdentity = {
  subject: 'user_admin_sub_test',
  issuer: 'https://nice-sailfish-32.clerk.accounts.dev',
  tokenIdentifier:
    'https://nice-sailfish-32.clerk.accounts.dev|user_admin_sub_test',
  email: 'admin@example.com',
  metadata: { role: 'admin' },
}

function setup() {
  const t = convexTest(schema, modules)
  rateLimiterTest.register(t)
  return t
}

/**
 * Property 6: Dismissing a submission excludes it from available view
 * Validates: dismiss mutation hides submissions from the default list
 *
 * For any submission in the pool, after dismiss is called on it,
 * querying the available submission list SHALL NOT include that
 * submission, and querying the dismissed list SHALL include it.
 */
describe('Property 6: Dismissing a submission excludes it from available view', () => {
  test('dismissed submission disappears from available list and appears in dismissed list', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        fc.nat(),
        async (numSubmissions, dismissedIndexRaw) => {
          const t = setup()
          const asAdmin = t.withIdentity(adminIdentity)

          // Pick which submission to dismiss
          const dismissedIndex = dismissedIndexRaw % numSubmissions

          // Create a user and submissions directly in the DB
          const submissionIds = await t.run(async (ctx) => {
            const userId = await ctx.db.insert('users', {
              tokenIdentifier: adminIdentity.tokenIdentifier,
              clerkId: adminIdentity.subject,
              updatedAt: Date.now(),
            })

            const ids = []
            for (let i = 0; i < numSubmissions; i++) {
              const id = await ctx.db.insert('submissions', {
                userId,
                topic: `Test topic ${i}`,
                submittedAt: Date.now() - (numSubmissions - i) * 1000,
              })
              ids.push(id)
            }
            return ids
          })

          const dismissedId = submissionIds[dismissedIndex]

          // Dismiss the submission
          await asAdmin.mutation(api.admin.submissions.dismiss, {
            id: dismissedId,
          })

          // Query available list — the dismissed submission should NOT appear
          const availableResult = await asAdmin.query(
            api.admin.submissions.list,
            { paginationOpts: { numItems: 50, cursor: null } },
          )
          const availableIds = availableResult.page.map(
            (s: { _id: string }) => s._id,
          )
          expect(availableIds).not.toContain(dismissedId)

          // Query dismissed list — the submission SHOULD appear
          const dismissedResult = await asAdmin.query(
            api.admin.submissions.listDismissed,
            { paginationOpts: { numItems: 50, cursor: null } },
          )
          const dismissedIds = dismissedResult.page.map(
            (s: { _id: string }) => s._id,
          )
          expect(dismissedIds).toContain(dismissedId)
        },
      ),
      { numRuns: 100 },
    )
  })
})

/**
 * Property 7: Undoing a dismissal returns the submission to the available pool
 * Validates: undoDismiss mutation restores dismissed submissions
 *
 * For any previously dismissed submission, after undoDismiss is called on it,
 * querying the available list SHALL include that submission,
 * and querying the dismissed list SHALL NOT include it.
 */
describe('Property 7: Undoing a dismissal returns the submission to the available pool', () => {
  test('restored submission reappears in available list and disappears from dismissed list', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        fc.nat(),
        async (numSubmissions, dismissedIndexRaw) => {
          const t = setup()
          const asAdmin = t.withIdentity(adminIdentity)

          // Pick which submission to dismiss then restore
          const dismissedIndex = dismissedIndexRaw % numSubmissions

          // Create a user and submissions directly in the DB
          const submissionIds = await t.run(async (ctx) => {
            const userId = await ctx.db.insert('users', {
              tokenIdentifier: adminIdentity.tokenIdentifier,
              clerkId: adminIdentity.subject,
              updatedAt: Date.now(),
            })

            const ids = []
            for (let i = 0; i < numSubmissions; i++) {
              const id = await ctx.db.insert('submissions', {
                userId,
                topic: `Test topic ${i}`,
                submittedAt: Date.now() - (numSubmissions - i) * 1000,
              })
              ids.push(id)
            }
            return ids
          })

          const dismissedId = submissionIds[dismissedIndex]

          // First dismiss it
          await asAdmin.mutation(api.admin.submissions.dismiss, {
            id: dismissedId,
          })

          // Then undo the dismissal
          await asAdmin.mutation(api.admin.submissions.undoDismiss, {
            id: dismissedId,
          })

          // Query available list — the submission SHOULD appear again
          const availableResult = await asAdmin.query(
            api.admin.submissions.list,
            { paginationOpts: { numItems: 50, cursor: null } },
          )
          const availableIds = availableResult.page.map(
            (s: { _id: string }) => s._id,
          )
          expect(availableIds).toContain(dismissedId)

          // Query dismissed list — the submission should NOT appear
          const dismissedResult = await asAdmin.query(
            api.admin.submissions.listDismissed,
            { paginationOpts: { numItems: 50, cursor: null } },
          )
          const dismissedIds = dismissedResult.page.map(
            (s: { _id: string }) => s._id,
          )
          expect(dismissedIds).not.toContain(dismissedId)
        },
      ),
      { numRuns: 100 },
    )
  })
})
