const TITLE_SMALL_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'if',
  'in',
  'nor',
  'of',
  'on',
  'or',
  'the',
  'to',
  'via',
  'vs',
])

const TERMINAL_PUNCTUATION = /[.!?…:;,)\]}>'"]$/
const LIST_ITEM = /^(?:[-*•]|\d+[.)])\s+/
const URL = /^https?:\/\//i

/**
 * Formats a user-entered topic for display without rewriting the stored value.
 * Mixed-case text is preserved so proper names, acronyms, and stylized names
 * are not guessed at.
 */
export function formatSubmissionTopic(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length === 0 || !hasUniformLetterCase(normalized)) {
    return normalized
  }

  return normalized
    .split(/(\s+)/)
    .map((segment, index, segments) => {
      if (/^\s+$/.test(segment)) return segment

      const match = segment.match(/^(\P{L}*)([\p{L}\p{N}][\p{L}\p{N}'’/-]*)(\P{L}*)$/u)
      if (!match) return segment

      const [, prefix, word, suffix] = match
      const normalizedWord = word.toLocaleLowerCase()
      const wordIndex = segments
        .slice(0, index)
        .filter((part) => !/^\s+$/.test(part)).length
      const wordCount = segments.filter((part) => !/^\s+$/.test(part)).length
      const isSmallWord =
        wordIndex > 0 && wordIndex < wordCount - 1 && TITLE_SMALL_WORDS.has(normalizedWord)

      return `${prefix}${isSmallWord ? normalizedWord : capitalizeWord(normalizedWord)}${suffix}`
    })
    .join('')
}

/**
 * Formats a details paragraph while preserving intentional line breaks.
 * Sentence starts are capitalized and ordinary prose receives terminal
 * punctuation; list items, URLs, and already-punctuated lines are left alone.
 */
export function formatSubmissionDetailsParagraph(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => formatDetailsLine(line))
    .join('\n')
}

function formatDetailsLine(line: string): string {
  const normalized = line.replace(/[ \t]+/g, ' ').trim()
  if (
    normalized.length === 0 ||
    LIST_ITEM.test(normalized) ||
    URL.test(normalized)
  ) {
    return normalized
  }

  const capitalized = normalized.replace(
    /(^|[.!?…]\s+)([a-z])/g,
    (_, boundary: string, letter: string) => `${boundary}${letter.toLocaleUpperCase()}`,
  )

  if (TERMINAL_PUNCTUATION.test(capitalized)) {
    return capitalized
  }

  return `${capitalized}.`
}

function hasUniformLetterCase(text: string): boolean {
  const letters = [...text].filter((character) => /\p{L}/u.test(character))
  if (letters.length === 0) return false

  return (
    letters.every((letter) => letter === letter.toLocaleLowerCase()) ||
    letters.every((letter) => letter === letter.toLocaleUpperCase())
  )
}

function capitalizeWord(word: string): string {
  const firstLetterIndex = word.search(/\p{L}/u)
  if (firstLetterIndex === -1) return word

  return (
    word.slice(0, firstLetterIndex) +
    word[firstLetterIndex].toLocaleUpperCase() +
    word.slice(firstLetterIndex + 1)
  )
}
