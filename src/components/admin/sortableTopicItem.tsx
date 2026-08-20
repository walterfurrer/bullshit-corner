import { CSS } from '@dnd-kit/utilities'

import { TopicListItem } from '#/components/admin/topicListItem'
import { SortableListItem } from '#/components/sortableListItem'
import { cn } from '#/lib/utils'

interface SortableTopicItemProps {
  id: string
  ranking: number
  title: string
  isFirst: boolean
  isLast: boolean
  reorderMode?: boolean
  moveDirection?: 'up' | 'down' | null
  onEdit: (id: string) => void
  onRemove: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

export function SortableTopicItem(props: SortableTopicItemProps) {
  return (
    <SortableListItem id={props.id}>
      {({ attributes, listeners, setNodeRef, transform, transition, isDragging }) => (
        <li
          ref={setNodeRef}
          style={{
            transform: CSS.Transform.toString(transform),
            transition,
          }}
          className={cn(
            props.moveDirection === 'up' && 'animate-bump-up',
            props.moveDirection === 'down' && 'animate-bump-down',
          )}
          {...attributes}
        >
          <TopicListItem
            {...props}
            isDragging={isDragging}
            dragHandleProps={listeners}
          />
        </li>
      )}
    </SortableListItem>
  )
}
