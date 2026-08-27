import { describe, expect, test } from 'vitest'

import {
  formatSubmissionDetailsParagraph,
  formatSubmissionTopic,
} from './submissionFormatting'

describe('formatSubmissionTopic', () => {
  test('formats clearly lowercase topics as title case', () => {
    expect(formatSubmissionTopic('gravel traps should replace tarmac runoffs')).toBe(
      'Gravel Traps Should Replace Tarmac Runoffs',
    )
  })

  test('formats clearly uppercase topics as title case', () => {
    expect(formatSubmissionTopic('TEAM PRINCIPAL RADIO')).toBe(
      'Team Principal Radio',
    )
  })

  test('preserves mixed-case names and acronyms', () => {
    expect(formatSubmissionTopic('iRacing F1 2026')).toBe('iRacing F1 2026')
  })

  test('normalizes topic whitespace without adding title punctuation', () => {
    expect(formatSubmissionTopic('  should   we race?  ')).toBe('Should We Race?')
  })
})

describe('formatSubmissionDetailsParagraph', () => {
  test('capitalizes sentence starts and adds ordinary terminal punctuation', () => {
    expect(formatSubmissionDetailsParagraph('this is the first thought. another thought')).toBe(
      'This is the first thought. Another thought.',
    )
  })

  test('preserves line breaks and existing punctuation', () => {
    expect(formatSubmissionDetailsParagraph('first line\nsecond line!')).toBe(
      'First line.\nSecond line!',
    )
  })

  test('leaves list items and URLs unchanged apart from whitespace', () => {
    expect(
      formatSubmissionDetailsParagraph('- max should win\nhttps://example.com/video'),
    ).toBe('- max should win\nhttps://example.com/video')
  })
})
