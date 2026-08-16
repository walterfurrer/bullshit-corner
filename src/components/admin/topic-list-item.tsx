import {
  ArrowDownIcon,
  ArrowUpIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react'

import { Button } from '#/components/ui/button.tsx'

interface TopicListItemProps {
  id: string
  ranking: number
  title: string
  description?: string
  isFirst: boolean
  isLast: boolean
  onEdit: (id: string) => void
  onRemove: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

export function TopicListItem({
  id,
  ranking,
  title,
  description,
  isFirst,
  isLast,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
}: TopicListItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
        {ranking}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{title}</p>
        {description && (
          <p className="truncate text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Move up"
          disabled={isFirst}
          onClick={() => onMoveUp(id)}
        >
          <ArrowUpIcon size={16} aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Move down"
          disabled={isLast}
          onClick={() => onMoveDown(id)}
        >
          <ArrowDownIcon size={16} aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Edit topic"
          onClick={() => onEdit(id)}
        >
          <PencilSimpleIcon size={16} aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Remove topic"
          onClick={() => onRemove(id)}
        >
          <TrashIcon size={16} aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
