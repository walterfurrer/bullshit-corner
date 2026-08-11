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
}

export interface NormalizedSubmission {
  topic: string
  submittedBy: string | undefined
}

export function normalizeSubmission(
  values: SubmissionInput,
): NormalizedSubmission {
  const alias = values.alias.trim()

  return {
    topic: values.topic.trim(),
    submittedBy: alias.length > 0 ? alias : undefined,
  }
}
