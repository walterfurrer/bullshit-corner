import { SignUp } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sign-up/$')({
  component: SignUpPage,
})

/**
 * Catch-all sign-up route.
 *
 * Mirror of /sign-in for the sign-up flow. Clerk's sign-in component has a
 * "Don't have an account? Sign up" link that navigates here.
 */
function SignUpPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <SignUp
        signInUrl="/sign-in"
        fallbackRedirectUrl="/onboarding"
        signInFallbackRedirectUrl="/"
      />
    </div>
  )
}
