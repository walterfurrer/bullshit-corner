/**
 * Returns an error string when the value is empty or whitespace-only,
 * undefined otherwise.
 */
export function validateTopic(value: string): string | undefined {
  if (value.trim().length === 0) {
    return 'Please enter a topic'
  }
  return undefined
}

/**
 * Returns an error string when value.length exceeds max,
 * undefined otherwise.
 */
export function validateLength(value: string, max: number): string | undefined {
  if (value.length > max) {
    return `Must be ${max.toLocaleString()} characters or fewer`
  }
  return undefined
}

/**
 * Returns an error string when the email is empty or has an invalid format,
 * undefined otherwise.
 */
export function validateEmail(value: string): string | undefined {
  if (value.trim().length === 0) {
    return 'Please enter your email'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return 'Please enter a valid email address'
  }
  return undefined
}

export interface SubmissionInput {
  topic: string
  evidence: string
  email: string
  alias: string
}

export interface NormalizedSubmission {
  topic: string
  evidence: string | undefined
  email: string
  submittedBy: string
}

/**
 * Trims all fields, converts whitespace-only evidence to undefined,
 * lowercases email, and substitutes "Anonymous Viewer" for a blank alias.
 */
export function normalizeSubmission(values: SubmissionInput): NormalizedSubmission {
  const trimmedEvidence = values.evidence.trim()
  const trimmedAlias = values.alias.trim()

  return {
    topic: values.topic.trim(),
    evidence: trimmedEvidence.length > 0 ? trimmedEvidence : undefined,
    email: values.email.trim().toLowerCase(),
    submittedBy: trimmedAlias.length > 0 ? trimmedAlias : 'Anonymous Viewer',
  }
}
