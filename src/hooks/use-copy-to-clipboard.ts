import { useState } from 'react'

export function useCopyToClipboard(resetDelay = 1500) {
  const [copied, setCopied] = useState(false)

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), resetDelay)
  }

  return { copied, copy }
}
