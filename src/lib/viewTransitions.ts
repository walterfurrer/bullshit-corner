interface ViewTransitionEnvironment {
  hasViewTransitionApi: boolean
  userAgent: string
}

/**
 * Safari and Firefox do not provide a reliable same-document View Transitions
 * experience for this app, so they retain standard client-side navigation.
 */
export function supportsAppViewTransitions({
  hasViewTransitionApi,
  userAgent,
}: ViewTransitionEnvironment) {
  if (!hasViewTransitionApi) return false

  const isFirefox = /(?:firefox|fxios)\//i.test(userAgent)
  const isSafari =
    /safari\//i.test(userAgent) &&
    !/(?:chrome|chromium|crios|edg|opr|opera|android)\//i.test(userAgent)

  return !isFirefox && !isSafari
}

/** Returns whether the current browser should opt in to app View Transitions. */
export function canUseAppViewTransitions() {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  return supportsAppViewTransitions({
    hasViewTransitionApi: 'startViewTransition' in document,
    userAgent: navigator.userAgent,
  })
}
