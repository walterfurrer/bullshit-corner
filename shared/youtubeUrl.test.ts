import { describe, expect, it } from 'vitest'

import { getYouTubeEmbedUrl, isValidYouTubeUrl } from './youtubeUrl'

describe('isValidYouTubeUrl', () => {
  describe('valid URLs', () => {
    it('accepts youtube.com/watch?v= format', () => {
      expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
      expect(isValidYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
    })

    it('accepts youtube.com/watch?v= with extra query params', () => {
      expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe(true)
      expect(isValidYouTubeUrl('https://youtube.com/watch?v=abc123&list=PLxyz')).toBe(true)
    })

    it('accepts youtu.be/ short format', () => {
      expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
    })

    it('accepts youtu.be/ with query params', () => {
      expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ?t=42')).toBe(true)
    })

    it('accepts youtube.com/shorts/ format', () => {
      expect(isValidYouTubeUrl('https://www.youtube.com/shorts/abc123')).toBe(true)
      expect(isValidYouTubeUrl('https://youtube.com/shorts/abc123')).toBe(true)
    })

    it('accepts youtube.com/live/ format', () => {
      expect(isValidYouTubeUrl('https://www.youtube.com/live/abc123')).toBe(true)
      expect(isValidYouTubeUrl('https://youtube.com/live/abc123')).toBe(true)
    })

    it('accepts video IDs with hyphens and underscores', () => {
      expect(isValidYouTubeUrl('https://youtu.be/a-b_c123')).toBe(true)
      expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=a-b_c123')).toBe(true)
    })
  })

  describe('invalid URLs', () => {
    it('rejects empty string', () => {
      expect(isValidYouTubeUrl('')).toBe(false)
    })

    it('rejects http (non-HTTPS) YouTube URLs', () => {
      expect(isValidYouTubeUrl('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false)
      expect(isValidYouTubeUrl('http://youtu.be/dQw4w9WgXcQ')).toBe(false)
    })

    it('rejects non-YouTube domains', () => {
      expect(isValidYouTubeUrl('https://vimeo.com/123456')).toBe(false)
      expect(isValidYouTubeUrl('https://example.com/watch?v=abc')).toBe(false)
      expect(isValidYouTubeUrl('https://notyoutube.com/watch?v=abc')).toBe(false)
    })

    it('rejects malformed URLs', () => {
      expect(isValidYouTubeUrl('not a url')).toBe(false)
      expect(isValidYouTubeUrl('youtube.com/watch?v=abc')).toBe(false)
    })

    it('rejects youtube.com without a video path', () => {
      expect(isValidYouTubeUrl('https://www.youtube.com')).toBe(false)
      expect(isValidYouTubeUrl('https://www.youtube.com/')).toBe(false)
      expect(isValidYouTubeUrl('https://www.youtube.com/channel/UCxyz')).toBe(false)
    })

    it('rejects youtube.com/watch without v param', () => {
      expect(isValidYouTubeUrl('https://www.youtube.com/watch')).toBe(false)
      expect(isValidYouTubeUrl('https://www.youtube.com/watch?list=PLxyz')).toBe(false)
    })
  })
})

describe('getYouTubeEmbedUrl', () => {
  it.each([
    ['watch URLs', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    ['watch URLs with extra query params', 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s'],
    ['short URLs', 'https://youtu.be/dQw4w9WgXcQ?t=42'],
    ['Shorts URLs', 'https://www.youtube.com/shorts/dQw4w9WgXcQ'],
    ['live URLs', 'https://youtube.com/live/dQw4w9WgXcQ'],
  ])('converts %s to an embed URL', (_label, url) => {
    expect(getYouTubeEmbedUrl(url)).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
  })

  it('returns undefined for unsupported URLs', () => {
    expect(getYouTubeEmbedUrl('https://www.youtube.com/channel/UCxyz')).toBeUndefined()
    expect(getYouTubeEmbedUrl('https://vimeo.com/123456')).toBeUndefined()
    expect(getYouTubeEmbedUrl('not a url')).toBeUndefined()
  })
})
