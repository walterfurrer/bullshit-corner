/**
 * Shared YouTube URL validation utility.
 *
 * Accepted formats (HTTPS only):
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - https://youtube.com/live/VIDEO_ID
 *
 * Optional query params (timestamps, playlists, etc.) are allowed after the
 * core pattern. This file must remain free of framework-specific imports.
 */

const YOUTUBE_REGEX =
  /^https:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+|^https:\/\/(www\.)?youtube\.com\/(shorts|live)\/[\w-]+|^https:\/\/youtu\.be\/[\w-]+/

/**
 * Returns `true` if `url` is a valid YouTube URL matching one of the
 * accepted patterns. Returns `false` for empty strings, non-YouTube domains,
 * http-only URLs, or malformed input.
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!url) return false

  try {
    const parsed = new URL(url)

    // Must be HTTPS
    if (parsed.protocol !== 'https:') return false

    return YOUTUBE_REGEX.test(url)
  } catch {
    // Malformed URL
    return false
  }
}
