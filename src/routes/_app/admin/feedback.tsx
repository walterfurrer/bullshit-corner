import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { Badge } from '#/components/ui/badge.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx'
import { ENABLE_TEST_FEEDBACK } from '#/lib/featureFlags'

import { api } from '#convex/_generated/api'

const feedbackQuery = convexQuery(api.admin.feedback.list, {})

const categoryLabels = {
  bug: 'Bug report',
  idea: 'Idea',
  general: 'General feedback',
} as const

export const Route = createFileRoute('/_app/admin/feedback')({
  beforeLoad: () => {
    if (!ENABLE_TEST_FEEDBACK) {
      throw redirect({ to: '/' })
    }
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(feedbackQuery)
  },
  component: FeedbackReview,
})

function FeedbackReview() {
  const { data: feedback } = useSuspenseQuery(feedbackQuery)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-racing-compact">
          Beta Feedback
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Newest feedback from the private beta environment.
        </p>
      </div>

      {feedback.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No beta feedback yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {feedback.map((item) => (
            <Card key={item.id} size="sm">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{categoryLabels[item.category]}</Badge>
                  <span className="font-mono text-xs font-normal text-muted-foreground">
                    {item.pagePath}
                  </span>
                </CardTitle>
                <CardDescription>
                  {item.user?.name ?? item.user?.email ?? 'Deleted tester'} ·{' '}
                  {new Date(item.createdAt).toISOString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{item.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
