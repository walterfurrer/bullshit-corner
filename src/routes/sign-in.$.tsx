import { SignIn } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sign-in/$')({
  component: SignInPage,
})

/**
 * Catch-all sign-in route.
 *
 * Clerk's prebuilt <SignIn> component handles all sub-paths internally
 * (e.g. /sign-in/sso-callback, /sign-in/factor-two). This route exists
 * so that OAuth redirects have a proper landing page where <SignIn> can
 * process the callback and display any errors — fixing the silent-failure
 * issue that occurs with modal-only auth.
 *
 * Users won't normally navigate here directly (the app uses modal sign-in),
 * but OAuth flows and magic links redirect here as their callback URL.
 */
function SignInPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <SignIn
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/onboarding"
      />
    </div>
  )
}
