import { defineApp } from 'convex/server'
import { v } from 'convex/values'
import rateLimiter from '@convex-dev/rate-limiter/convex.config.js'

const app = defineApp({
  env: {
    TEST_FEEDBACK_ENABLED: v.optional(v.string()),
  },
})
app.use(rateLimiter)

export default app
