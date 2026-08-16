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
 * Property 6: Marking a submission as chosen excludes it from default view
 * Validates: Requirements 5.2, 5.4
 *
 * For any submission in the pool, after markChosen is called on it,
 * querying the default (unchosen) submission list SHALL NOT include that
 * submission, and querying the chosen list SHALL include it.
 */
describe('Property 6: Marking a submission as chosen excludes it from default view', () => {
  test('marked submission disappears from unchosen list and appears in chosen list', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        fc.nat(),
        async (numSubmissions, chosenIndexRaw) => {
          const t = setup()
          const asAdmin = t.withIdentity(adminIdentity)

          // Pick which submission to mark as chosen
          const chosenIndex = chosenIndexRaw % numSubmissions

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

          const chosenId = submissionIds[chosenIndex]

          // Mark the chosen submission
          await asAdmin.mutation(api.admin.submissions.markChosen, {
            id: chosenId,
          })

          // Query unchosen list — the marked submission should NOT appear
          const unchosenResult = await asAdmin.query(
            api.admin.submissions.list,
            { paginationOpts: { numItems: 50, cursor: null } },
          )
          const unchosenIds = unchosenResult.page.map(
            (s: { _id: string }) => s._id,
          )
          expect(unchosenIds).not.toContain(chosenId)

          // Query chosen list — the marked submission SHOULD appear
          const chosenResult = await asAdmin.query(
            api.admin.submissions.listChosen,
            { paginationOpts: { numItems: 50, cursor: null } },
          )
          const chosenIds = chosenResult.page.map(
            (s: { _id: string }) => s._id,
          )
          expect(chosenIds).toContain(chosenId)
        },
      ),
      { numRuns: 100 },
    )
  })
})

/**
 * Property 7: Unmarking a chosen submission returns it to the pool
 * Validates: Requirements 5.6
 *
 * For any previously chosen submission, after unmarkChosen is called on it,
 * querying the default (unchosen) submission list SHALL include that submission,
 * and querying the chosen list SHALL NOT include it.
 */
describe('Property 7: Unmarking a chosen submission returns it to the pool', () => {
  test('unmarked submission reappears in unchosen list and disappears from chosen list', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        fc.nat(),
        async (numSubmissions, chosenIndexRaw) => {
          const t = setup()
          const asAdmin = t.withIdentity(adminIdentity)

          // Pick which submission to mark then unmark
          const chosenIndex = chosenIndexRaw % numSubmissions

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

          const chosenId = submissionIds[chosenIndex]

          // First mark it as chosen
          await asAdmin.mutation(api.admin.submissions.markChosen, {
            id: chosenId,
          })

          // Then unmark it
          await asAdmin.mutation(api.admin.submissions.unmarkChosen, {
            id: chosenId,
          })

          // Query unchosen list — the submission SHOULD appear again
          const unchosenResult = await asAdmin.query(
            api.admin.submissions.list,
            { paginationOpts: { numItems: 50, cursor: null } },
          )
          const unchosenIds = unchosenResult.page.map(
            (s: { _id: string }) => s._id,
          )
          expect(unchosenIds).toContain(chosenId)

          // Query chosen list — the submission should NOT appear
          const chosenResult = await asAdmin.query(
            api.admin.submissions.listChosen,
            { paginationOpts: { numItems: 50, cursor: null } },
          )
          const chosenIds = chosenResult.page.map(
            (s: { _id: string }) => s._id,
          )
          expect(chosenIds).not.toContain(chosenId)
        },
      ),
      { numRuns: 100 },
    )
  })
})
