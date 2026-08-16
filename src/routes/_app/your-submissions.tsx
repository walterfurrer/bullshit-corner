import { Suspense } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useConvexAuth } from 'convex/react'

import { SubmissionCard } from '#/components/submissionCard'
import { SiteFooter } from '#/components/siteFooter'
import { Button } from '#/components/ui/button.tsx'
import { Skeleton } from '#/components/ui/skeleton.tsx'

import { api } from '#convex/_generated/api'

export const Route = createFileRoute('/_app/your-submissions')({
  head: () => ({
    meta: [{ title: 'Your Submissions | Bullshit Corner' }],
  }),
  component: YourSubmissionsPage,
})

function YourSubmissionsPage() {
  const { isAuthenticated, isLoading } = useConvexAuth()

  if (isLoading) {
    return (
      <PageShell>
        <LoadingSkeleton />
      </PageShell>
    )
  }

  if (!isAuthenticated) {
    return (
      <PageShell>
        <AuthGate />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <Suspense fallback={<LoadingSkeleton />}>
        <SubmissionsList />
      </Suspense>
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <div className="flex flex-col gap-2">
        <h1>Your Submissions</h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Topics you've submitted to Bullshit Corner.
        </p>
      </div>
      {children}
      <SiteFooter />
    </div>
  )
}

function AuthGate() {
  return (
    <div
      className="flex flex-col items-start gap-4"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm text-muted-foreground sm:text-base">
        You must be logged in to see this page.
      </p>
      <Button render={<Link to="/" viewTransition />} nativeButton={false} variant="outline">Go to Home</Button>
    </div>
  )
}

function SubmissionsList() {
  const { data: submissions } = useSuspenseQuery(
    convexQuery(api.submissions.listMine, {}),
  )

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-sm text-muted-foreground sm:text-base">
          You haven't submitted any topics yet.
        </p>
        <Button render={<Link to="/submit-topic" viewTransition />} nativeButton={false}>Submit a Topic</Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {submissions.map((submission) => (
        <SubmissionCard
          key={submission._id}
          topic={submission.topic}
          details={submission.details}
          submittedBy={submission.submittedBy}
          submittedAt={submission.submittedAt}
        />
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  )
}
