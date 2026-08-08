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

export interface SubmissionInput {
  topic: string
  evidence: string
  alias: string
}

export interface NormalizedSubmission {
  topic: string
  evidence: string | undefined
  submittedBy: string
}

/**
 * Trims all fields, converts whitespace-only evidence to undefined,
 * and substitutes "Anonymous Viewer" for a blank alias.
 */
export function normalizeSubmission(values: SubmissionInput): NormalizedSubmission {
  const trimmedEvidence = values.evidence.trim()
  const trimmedAlias = values.alias.trim()

  return {
    topic: values.topic.trim(),
    evidence: trimmedEvidence.length > 0 ? trimmedEvidence : undefined,
    submittedBy: trimmedAlias.length > 0 ? trimmedAlias : 'Anonymous Viewer',
  }
}
