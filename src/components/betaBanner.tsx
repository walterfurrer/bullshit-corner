import { FlaskIcon } from '@phosphor-icons/react'

import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert.tsx'
import { ENABLE_TEST_FEEDBACK } from '#/lib/featureFlags'
import { Link } from '@tanstack/react-router'

export function BetaBanner() {
  if (!ENABLE_TEST_FEEDBACK) {
    return null
  }

  return (
    <Alert variant="warning" className="rounded-none border-x-0 border-t-0">
      <FlaskIcon aria-hidden="true" />
      <AlertTitle>Private beta</AlertTitle>
      <AlertDescription>
        Thanks for your help testing out Bullshit Corner! Please use the <Link to={"/feedback"}>Beta Feedback</Link> page to provide ideas or bug reports.
      </AlertDescription>
    </Alert>
  )
}
