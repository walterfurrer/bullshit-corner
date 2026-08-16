import {
  ArrowDownIcon,
  ArrowUpIcon,
  DotsSixVerticalIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react'

import { PositionBadge } from '#/components/positionBadge'
import { Button } from '#/components/ui/button.tsx'

interface TopicListItemProps {
  id: string
  ranking: number
  title: string
  description?: string
  isFirst: boolean
  isLast: boolean
  isDragging?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
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
  isDragging,
  dragHandleProps,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
}: TopicListItemProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-border px-4 py-3 ${isDragging ? 'opacity-50' : ''}`}
    >
      {dragHandleProps && (
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...dragHandleProps}
        >
          <DotsSixVerticalIcon size={20} aria-hidden="true" />
        </button>
      )}

      <PositionBadge position={ranking} className="shrink-0" />

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
