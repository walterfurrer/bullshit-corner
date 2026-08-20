import { FlaskIcon } from '@phosphor-icons/react'

import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert.tsx'
import { ENABLE_TEST_FEEDBACK } from '#/lib/featureFlags'

export function BetaBanner() {
  if (!ENABLE_TEST_FEEDBACK) {
    return null
  }

  return (
    <Alert variant="warning" className="rounded-none border-x-0 border-t-0">
      <FlaskIcon aria-hidden="true" />
      <AlertTitle>Private beta</AlertTitle>
      <AlertDescription>
        You’re helping test Bullshit Corner before launch. Please don’t submit
        sensitive or personal information—beta data may be deleted.
      </AlertDescription>
    </Alert>
  )
}
