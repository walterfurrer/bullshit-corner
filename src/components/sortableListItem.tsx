import { useSortable } from '@dnd-kit/sortable'

interface SortableListItemProps {
  id: string
  children: (sortable: ReturnType<typeof useSortable>) => React.ReactNode
}

/** Shared sortable state for the admin and community leaderboard lists. */
export function SortableListItem({ id, children }: SortableListItemProps) {
  return children(useSortable({ id }))
}
