import { createFileRoute } from '@tanstack/react-router'

import { SubmissionForm } from '#/components/submission-form.tsx'
import { SiteFooter } from '#/components/site-footer.tsx'
import { SiteHeader } from '#/components/site-header.tsx'

export const Route = createFileRoute('/nominate')({
  component: NominateTopicPage,
})

function NominateTopicPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-2">
          <h1>Nominate a Topic</h1>
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

        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <p className="font-medium">A free account is required to submit.</p>
          <p className="mt-1 text-muted-foreground">
            You can fill out the form first. If you are signed out, we will ask
            you to sign in or create an account when you submit. This helps keep
            nominations fair and limits spam.
          </p>
        </div>

        <SubmissionForm />
        <SiteFooter />
      </main>
    </div>
  )
}
