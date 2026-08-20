import {
  ArrowDownIcon,
  ArrowUpIcon,
  DotsThreeIcon,
  DotsSixVerticalIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react'

import { PositionBadge } from '#/components/positionBadge'
import { Button } from '#/components/ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdownMenu'
import { cn } from '#/lib/utils'

interface TopicListItemProps {
  id: string
  ranking: number
  title: string
  isFirst: boolean
  isLast: boolean
  isDragging?: boolean
  reorderMode?: boolean
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
  isFirst,
  isLast,
  isDragging,
  reorderMode = false,
  dragHandleProps,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
}: TopicListItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/30 focus-within:bg-accent/30',
        isDragging && 'relative z-10 rounded-md bg-card shadow-md ring-1 ring-primary/30',
      )}
    >
      {/* Drag handle — always visible on desktop, only in reorder mode on mobile */}
      {dragHandleProps && (
        <button
          type="button"
          className={cn(
            'shrink-0 cursor-grab touch-none items-center justify-center rounded-xs p-1.5 text-muted-foreground hover:text-foreground focus-visible:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring/50 active:cursor-grabbing md:flex md:p-0',
            reorderMode ? 'flex' : 'hidden',
          )}
          aria-label="Drag to reorder"
          {...dragHandleProps}
        >
          <DotsSixVerticalIcon size={20} aria-hidden="true" />
        </button>
      )}

      <PositionBadge position={ranking} className="shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{title}</p>
      </div>

      {/* Desktop inline actions — always visible */}
      <div className="hidden shrink-0 items-center gap-1 md:flex">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Move up"
          disabled={isFirst}
          onClick={() => onMoveUp(id)}
        >
          <ArrowUpIcon data-icon="inline-start" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Move down"
          disabled={isLast}
          onClick={() => onMoveDown(id)}
        >
          <ArrowDownIcon data-icon="inline-start" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Edit topic"
          onClick={() => onEdit(id)}
        >
          <PencilSimpleIcon data-icon="inline-start" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Remove topic"
          onClick={() => onRemove(id)}
        >
          <TrashIcon data-icon="inline-start" aria-hidden="true" />
        </Button>
      </div>

      {/* Mobile — reorder mode: show up/down buttons */}
      {reorderMode && (
        <div className="flex shrink-0 items-center gap-1 md:hidden">
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Move up"
            disabled={isFirst}
            onClick={() => onMoveUp(id)}
          >
            <ArrowUpIcon data-icon="inline-start" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Move down"
            disabled={isLast}
            onClick={() => onMoveDown(id)}
          >
            <ArrowDownIcon data-icon="inline-start" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Mobile — normal mode: overflow menu with Edit + Remove */}
      {!reorderMode && (
        <div className="shrink-0 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex size-10 items-center justify-center rounded-xs text-muted-foreground hover:text-foreground"
              aria-label="Topic actions"
            >
              <DotsThreeIcon size={24} weight="bold" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(id)}>
                <PencilSimpleIcon data-icon="inline-start" aria-hidden="true" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRemove(id)}>
                <TrashIcon data-icon="inline-start" aria-hidden="true" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
