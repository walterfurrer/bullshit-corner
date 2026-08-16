/// <reference types="vite/client" />

import { convexTest } from 'convex-test'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { api } from '../_generated/api'
import schema from '../schema'

// Glob all .ts files under convex/ (from convex/admin/, "../" is convex/).
// Vite keys are relative to THIS file's directory:
//   - Sibling files: "./topics.ts"
//   - Parent-level files: "../schema.ts", "../_generated/api.d.ts"
// convex-test expects keys relative to the convex root like "./<path>.ts".
// We normalize by prefixing sibling keys with "./admin/" and stripping "../" from parent keys.
const rawModules = import.meta.glob('../**/*.ts')
const modules: Record<string, () => Promise<any>> = {}
for (const [key, value] of Object.entries(rawModules)) {
  let normalized: string
  if (key.startsWith('../')) {
    // Parent-level: "../schema.ts" → "./schema.ts", "../_generated/api.d.ts" → "./_generated/api.d.ts"
    normalized = './' + key.slice(3)
  } else if (key.startsWith('./')) {
    // Same directory (admin/): "./topics.ts" → "./admin/topics.ts"
    normalized = './admin/' + key.slice(2)
  } else {
    normalized = key
  }
  modules[normalized] = value as () => Promise<any>
}

const adminIdentity = {
  subject: 'user_admin_topics_test',
  issuer: 'https://nice-sailfish-32.clerk.accounts.dev',
  tokenIdentifier:
    'https://nice-sailfish-32.clerk.accounts.dev|user_admin_topics_test',
  email: 'admin@example.com',
  metadata: { role: 'admin' },
}

/**
 * Property 8: Title validation rejects empty and oversized titles
 * Validates: Requirements 4.6
 *
 * For any string that is empty (after trimming) or exceeds 200 characters
 * after trimming, the topic create and update mutations SHALL reject the
 * operation with a VALIDATION_ERROR.
 */
describe('Property 8: Title validation rejects empty and oversized titles', () => {
  const invalidTitle = fc.oneof(
    // Empty string
    fc.constant(''),
    // Whitespace-only strings
    fc
      .array(fc.constantFrom(' ', '\t', '\n', '\r'), {
        minLength: 1,
        maxLength: 20,
      })
      .map((chars) => chars.join('')),
    // Oversized strings: guaranteed >200 non-whitespace chars (won't shrink below 201 after trim)
    fc
      .string({ minLength: 1, maxLength: 300 })
      .map((s) => 'x'.repeat(201) + s.replace(/^\s+|\s+$/g, '')),
  )

  test('create mutation rejects invalid titles with VALIDATION_ERROR', async () => {
    await fc.assert(
      fc.asyncProperty(invalidTitle, async (title) => {
        const t = convexTest(schema, modules)
        const asAdmin = t.withIdentity(adminIdentity)

        await expect(
          asAdmin.mutation(api.admin.topics.create, {
            title,
            ranking: 1,
          }),
        ).rejects.toMatchObject({
          data: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
        })
      }),
      { numRuns: 100 },
    )
  })

  test('update mutation rejects invalid titles with VALIDATION_ERROR', async () => {
    await fc.assert(
      fc.asyncProperty(invalidTitle, async (title) => {
        const t = convexTest(schema, modules)
        const asAdmin = t.withIdentity(adminIdentity)

        // First create a valid topic to update
        const topicId = await asAdmin.mutation(api.admin.topics.create, {
          title: 'Valid Topic',
          ranking: 1,
        })

        // Then attempt to update with an invalid title
        await expect(
          asAdmin.mutation(api.admin.topics.update, {
            id: topicId,
            title,
          }),
        ).rejects.toMatchObject({
          data: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
        })
      }),
      { numRuns: 100 },
    )
  })
})
