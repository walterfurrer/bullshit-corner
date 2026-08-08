import { createFileRoute } from '@tanstack/react-router'

import { SubmissionForm } from '#/components/submission-form.tsx'
import { SiteFooter } from '#/components/site-footer.tsx'
import { SiteHeader } from '#/components/site-header.tsx'

export const Route = createFileRoute('/submit')({
  component: SubmitPage,
})

function SubmitPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 flex flex-col gap-8 sm:px-6 sm:py-14 sm:gap-10">
        <div className="flex flex-col gap-2">
          <h1>Nominate a Topic</h1>
          <div className="flex flex-col gap-2">
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Think something deserves a spot in Bullshit Corner? Submit it here and the hosts might debate it on the next episode of High Performance Racing.
            </p>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              It can be a bullshit opinion, a bullshit race, a part of a car, a season, a person, a thing — anything you like!
            </p>
          </div>
        </div>
        <SubmissionForm />
        <SiteFooter />
      </main>
    </div>
  )
}
