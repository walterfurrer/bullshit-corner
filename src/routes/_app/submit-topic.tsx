import { Show } from '@clerk/tanstack-react-start'
import { createFileRoute, Link } from '@tanstack/react-router'

import { SubmissionForm } from '#/components/submission-form.tsx'
import { SiteFooter } from '#/components/site-footer.tsx'
import { ENABLE_AUTH } from '#/lib/feature-flags.ts'

export const Route = createFileRoute('/_app/submit-topic')({
  component: SubmitTopicPage,
})

function SubmitTopicPage() {
  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <div className="flex flex-col gap-2">
        <h1>Submit a Topic</h1>
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
      </div>

      {ENABLE_AUTH && (
        <Show when="signed-out">
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
            <p className="font-medium">A free account is required to submit.</p>
            <p className="mt-1 text-muted-foreground">
              Fill out the form first — when you hit submit, we'll ask you to
              sign in or create a free account. This helps keep submissions fair
              and limits spam.
            </p>
          </div>
        </Show>
      )}

      <SubmissionForm />

      {ENABLE_AUTH && (
        <Show when="signed-in">
          <p className="text-sm text-muted-foreground">
            <Link
              to="/your-submissions"
              className="font-medium transition-colors duration-200 hover:text-primary"
            >
              View your past submissions →
            </Link>
          </p>
        </Show>
      )}

      <SiteFooter />
    </div>
  )
}
