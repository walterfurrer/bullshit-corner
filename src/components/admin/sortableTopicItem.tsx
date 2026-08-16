import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { TopicListItem } from '#/components/admin/topicListItem'

interface SortableTopicItemProps {
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

export function SortableTopicItem(props: SortableTopicItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TopicListItem
        {...props}
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  )
}
