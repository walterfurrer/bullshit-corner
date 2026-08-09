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
  evidence: string
  alias: string
}

export interface NormalizedSubmission {
  topic: string
  evidence: string | undefined
  submittedBy: string | undefined
}

export function normalizeSubmission(
  values: SubmissionInput,
): NormalizedSubmission {
  const evidence = values.evidence.trim()
  const alias = values.alias.trim()

  return {
    topic: values.topic.trim(),
    evidence: evidence.length > 0 ? evidence : undefined,
    submittedBy: alias.length > 0 ? alias : undefined,
  }
}
