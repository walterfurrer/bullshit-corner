import { useState } from 'react'

import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { TITLE_MAX } from '#shared/constants'

export interface TopicFormValues {
  title: string
  ranking?: number
  youtubeUrl?: string
  submittedBy?: string
}

interface TopicFormProps {
  initialValues?: Partial<TopicFormValues>
  onSubmit: (values: TopicFormValues) => void | Promise<void>
  onCancel?: () => void
  submitLabel?: string
  isSubmitting?: boolean
  /** When true, shows a ranking input field */
  showRanking?: boolean
  /** Maximum valid ranking value (total topics + 1 for new entries) */
  maxRanking?: number
}

export function TopicForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  isSubmitting = false,
  showRanking = false,
  maxRanking = 1,
}: TopicFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [ranking, setRanking] = useState(() =>
    String(initialValues?.ranking ?? maxRanking),
  )
  const [youtubeUrl, setYoutubeUrl] = useState(
    initialValues?.youtubeUrl ?? '',
  )
  const [submittedBy, setSubmittedBy] = useState(
    initialValues?.submittedBy ?? '',
  )
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedTitle = title.trim()
    if (trimmedTitle.length === 0) {
      setError('Title is required.')
      return
    }
    if (trimmedTitle.length > TITLE_MAX) {
      setError(`Title must be ${TITLE_MAX} characters or fewer.`)
      return
    }

    const parsedRanking = Number(ranking)
    if (
      showRanking &&
      (!Number.isInteger(parsedRanking) || parsedRanking < 1 || parsedRanking > maxRanking)
    ) {
      setError(`Ranking must be a whole number from 1 to ${maxRanking}.`)
      return
    }

    onSubmit({
      title: trimmedTitle,
      ranking: showRanking ? parsedRanking : undefined,
      youtubeUrl: youtubeUrl.trim() || undefined,
      submittedBy: submittedBy.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="topic-title">Title *</Label>
        <Input
          id="topic-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Topic title"
          maxLength={TITLE_MAX + 50}
          required
        />
        <p className="text-xs text-muted-foreground">
          {title.trim().length}/{TITLE_MAX} characters
        </p>
      </div>

      {showRanking && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="topic-ranking">Ranking Position *</Label>
          <Input
            id="topic-ranking"
            type="number"
            min={1}
            max={maxRanking}
            value={ranking}
            onChange={(e) => setRanking(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Enter a position from 1 to {maxRanking}. Existing items at this position and below will shift down.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="topic-youtube-url">YouTube URL</Label>
        <Input
          id="topic-youtube-url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/..."
          type="url"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="topic-submitted-by">Submitted By</Label>
        <Input
          id="topic-submitted-by"
          value={submittedBy}
          onChange={(e) => setSubmittedBy(e.target.value)}
          placeholder="Optional attribution"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
