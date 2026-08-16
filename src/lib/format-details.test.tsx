import { describe, expect, test } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { FormatDetails } from './format-details'

function render(text: string, className?: string) {
  return renderToStaticMarkup(<FormatDetails text={text} className={className} />)
}

describe('FormatDetails', () => {
  test('single paragraph (no newlines) renders one <p>', () => {
    const html = render('Hello world')
    expect(html).toBe(
      '<div class="flex flex-col gap-2"><p>Hello world</p></div>',
    )
  })

  test('applies className to each paragraph', () => {
    const html = render('Line one\n\nLine two', 'text-sm text-muted-foreground')
    expect(html).toContain('<p class="text-sm text-muted-foreground">Line one</p>')
    expect(html).toContain('<p class="text-sm text-muted-foreground">Line two</p>')
  })

  test('double newlines split into multiple paragraphs', () => {
    const html = render('First paragraph\n\nSecond paragraph\n\nThird paragraph')
    expect(html).toContain('<p>First paragraph</p>')
    expect(html).toContain('<p>Second paragraph</p>')
    expect(html).toContain('<p>Third paragraph</p>')
    // Should have exactly 3 <p> elements
    expect(html.match(/<p>/g)?.length).toBe(3)
  })

  test('single newlines within a paragraph render as <br/>', () => {
    const html = render('Line one\nLine two\nLine three')
    expect(html).toBe(
      '<div class="flex flex-col gap-2"><p>Line one<br/>Line two<br/>Line three</p></div>',
    )
  })

  test('excessive blank lines (5+ newlines) collapse to a single paragraph boundary', () => {
    const html = render('Before\n\n\n\n\nAfter')
    expect(html.match(/<p>/g)?.length).toBe(2)
    expect(html).toContain('<p>Before</p>')
    expect(html).toContain('<p>After</p>')
  })

  test('paragraph cap: only first 10 paragraphs are rendered', () => {
    const paragraphs = Array.from({ length: 15 }, (_, i) => `Paragraph ${i + 1}`)
    const text = paragraphs.join('\n\n')
    const html = render(text)
    expect(html.match(/<p>/g)?.length).toBe(10)
    expect(html).toContain('Paragraph 10')
    expect(html).not.toContain('Paragraph 11')
  })

  test('trims whitespace around paragraphs', () => {
    const html = render('  Spaced  \n\n  Also spaced  ')
    expect(html).toContain('<p>Spaced</p>')
    expect(html).toContain('<p>Also spaced</p>')
  })

  test('filters out empty chunks from consecutive separators', () => {
    const html = render('\n\n\n\nOnly content\n\n\n\n')
    expect(html.match(/<p>/g)?.length).toBe(1)
    expect(html).toContain('<p>Only content</p>')
  })
})
