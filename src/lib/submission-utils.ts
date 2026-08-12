export function validateTopic(value: string): string | undefined {
  if (value.trim().length === 0) {
    return 'Please enter a topic'
  }

  return undefined
}

export function validateLength(value: string, max: number): string | undefined {
  if (value.length > max) {
    return `Must be ${max.toLocaleString()} characters or fewer`
  }

  return undefined
}

export interface SubmissionInput {
  topic: string
  alias: string
  details: string
}

export interface NormalizedSubmission {
  topic: string
  details: string | undefined
  submittedBy: string | undefined
}

export function normalizeSubmission(
  values: SubmissionInput,
): NormalizedSubmission {
  const alias = values.alias.trim()
  const details = values.details.trim()

  return {
    topic: values.topic.trim(),
    details: details.length > 0 ? details : undefined,
    submittedBy: alias.length > 0 ? alias : undefined,
  }
}
