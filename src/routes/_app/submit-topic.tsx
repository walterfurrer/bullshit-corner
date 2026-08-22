import { Show } from '@clerk/tanstack-react-start'
import { createFileRoute, Link } from '@tanstack/react-router'

import { SubmissionForm } from '#/components/submissionForm'
import { PageHeader, PageLayout } from '#/components/pageLayout'
import { SiteFooter } from '#/components/siteFooter'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '#/components/ui/alert.tsx'
import { currentUserQuery } from '#/hooks/useCurrentUser.ts'
import { ENABLE_AUTH } from '#/lib/featureFlags'
import { canUseAppViewTransitions } from '#/lib/viewTransitions'

export const Route = createFileRoute('/_app/submit-topic')({
  head: () => ({
    meta: [{ title: 'Submit a Topic | Bullshit Corner' }],
  }),
  loader: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(currentUserQuery)
    return { user }
  },
  component: SubmitTopicPage,
})

function SubmitTopicPage() {
  const { user } = Route.useLoaderData()

  return (
    <PageLayout>
      <PageHeader title="Submit a Topic">
        <div className="flex flex-col gap-2">
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Think something deserves a spot in Bullshit Corner? Submit it here
            and the hosts might debate it on the next episode of High
            Performance Racing.
          </p>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            It can be a bullshit opinion, a bullshit race, a part of a car, a
            season, a person, a thing — anything you like!
          </p>
        </div>
      </PageHeader>

      {ENABLE_AUTH && (
        <Show when="signed-out">
          <Alert
            className="rounded-lg"
            role="note"
          >
            <AlertTitle>A free account is required to submit.</AlertTitle>
            <AlertDescription>
              Fill out the form first — when you hit submit, we'll ask you to
              sign in or create a free account. This helps keep submissions fair
              and limits spam.
            </AlertDescription>
          </Alert>
        </Show>
      )}

      <SubmissionForm user={user} />

      {ENABLE_AUTH && (
        <Show when="signed-in">
          <p className="text-sm text-muted-foreground">
            <Link
              to="/yourSubmissions"
              className="font-medium transition-colors duration-200 hover:text-primary"
              viewTransition={canUseAppViewTransitions()}
            >
              View your past submissions →
            </Link>
          </p>
        </Show>
      )}

      <SiteFooter />
    </PageLayout>
  )
}
