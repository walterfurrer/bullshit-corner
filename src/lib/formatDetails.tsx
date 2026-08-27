import type { ReactNode } from 'react'

import { formatSubmissionDetailsParagraph } from './submissionFormatting'

const MAX_PARAGRAPHS = 10

interface FormatDetailsProps {
  text: string
  className?: string
}

/**
 * Renders a plain-text string as structured paragraphs.
 *
 * - Double (or more) newlines split into separate `<p>` elements.
 * - Single newlines within a paragraph render as `<br />`.
 * - Excessive blank lines are collapsed (empty chunks are filtered out).
 * - Output is capped at 10 paragraphs to prevent layout abuse.
 */
export function FormatDetails({ text, className }: FormatDetailsProps) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .slice(0, MAX_PARAGRAPHS)

  return (
    <div className="flex flex-col gap-2">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={className}>
          {injectLineBreaks(formatSubmissionDetailsParagraph(paragraph))}
        </p>
      ))}
    </div>
  )
}

function injectLineBreaks(paragraph: string): ReactNode[] {
  const lines = paragraph.split('\n')

  return lines.reduce<ReactNode[]>((acc, line, index) => {
    if (index > 0) {
      acc.push(<br key={`br-${index}`} />)
    }
    acc.push(line)
    return acc
  }, [])
}
