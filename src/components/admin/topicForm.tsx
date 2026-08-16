import { useState } from 'react'

import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { Textarea } from '#/components/ui/textarea.tsx'

const TITLE_MAX = 200

export interface TopicFormValues {
  title: string
  description?: string
  youtubeUrl?: string
  submittedBy?: string
}

interface TopicFormProps {
  initialValues?: Partial<TopicFormValues>
  onSubmit: (values: TopicFormValues) => void | Promise<void>
  onCancel?: () => void
  submitLabel?: string
  isSubmitting?: boolean
}

export function TopicForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  isSubmitting = false,
}: TopicFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(
    initialValues?.description ?? '',
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

    onSubmit({
      title: trimmedTitle,
      description: description.trim() || undefined,
      youtubeUrl: youtubeUrl.trim() || undefined,
      submittedBy: submittedBy.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
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

      <div className="space-y-2">
        <Label htmlFor="topic-description">Description</Label>
        <Textarea
          id="topic-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="topic-youtube-url">YouTube URL</Label>
        <Input
          id="topic-youtube-url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/..."
          type="url"
        />
      </div>

      <div className="space-y-2">
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
