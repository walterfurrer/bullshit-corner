/**
 * Pure derivation of the submission form alias field state.
 *
 * Deterministically computes the alias field value and disabled state
 * based on auth state and user profile, independent of React rendering.
 */

export type AliasFieldState = {
  value: string
  disabled: boolean
}

export function deriveAliasField(
  user: { name?: string; alwaysAnonymous?: boolean } | null,
  enableAuth: boolean,
  isAuthenticated: boolean,
): AliasFieldState {
  if (!enableAuth || !isAuthenticated || !user) {
    return { value: '', disabled: false }
  }

  if (user.alwaysAnonymous) {
    return { value: 'Anonymous', disabled: true }
  }

  if (user.name) {
    return { value: user.name, disabled: false }
  }

  return { value: '', disabled: false }
}
