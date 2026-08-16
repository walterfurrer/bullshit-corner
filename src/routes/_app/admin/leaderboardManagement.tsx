import { useCallback, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import {
  TopicForm,
  type TopicFormValues,
} from '#/components/admin/topicForm'
import { SortableTopicItem } from '#/components/admin/sortableTopicItem'
import { Button } from '#/components/ui/button.tsx'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog.tsx'

import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'

const topicsQuery = convexQuery(api.admin.topics.list, {})

export const Route = createFileRoute('/_app/admin/leaderboardManagement')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(topicsQuery)
  },
  component: LeaderboardManagement,
})

function LeaderboardManagement() {
  const { data: serverTopics } = useSuspenseQuery(topicsQuery)
  const [editingId, setEditingId] = useState<Id<'topics'> | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  // Optimistic local order — overrides server data while a reorder is in-flight
  const [optimisticTopics, setOptimisticTopics] = useState<typeof serverTopics | null>(null)
  const pendingReorders = useRef(0)

  // Track which item was just moved via buttons for the slide animation
  const [movedItem, setMovedItem] = useState<{ id: string; direction: 'up' | 'down' } | null>(null)
  const moveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const markAsMoved = useCallback((id: string, direction: 'up' | 'down') => {
    if (moveTimeout.current) clearTimeout(moveTimeout.current)
    setMovedItem({ id, direction })
    moveTimeout.current = setTimeout(() => setMovedItem(null), 300)
  }, [])

  // Use optimistic order when available, otherwise fall back to server data
  const topics = optimisticTopics ?? serverTopics

  // When server data updates and no reorder is pending, clear the override
  // (handled implicitly: optimisticTopics is only set during in-flight mutations)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const createMutation = useMutation({
    mutationFn: useConvexMutation(api.admin.topics.create),
  })
  const updateMutation = useMutation({
    mutationFn: useConvexMutation(api.admin.topics.update),
  })
  const removeMutation = useMutation({
    mutationFn: useConvexMutation(api.admin.topics.remove),
  })

  const reorderMutationFn = useConvexMutation(api.admin.topics.reorder)
  const reorderMutation = useMutation({
    mutationFn: reorderMutationFn,
    onSettled: () => {
      pendingReorders.current -= 1
      // Only clear optimistic state when all in-flight reorders have settled
      if (pendingReorders.current <= 0) {
        pendingReorders.current = 0
        setOptimisticTopics(null)
      }
    },
  })

  const editingTopic = editingId
    ? topics.find((t) => t._id === editingId)
    : null

  async function handleCreate(values: TopicFormValues) {
    await createMutation.mutateAsync({
      ...values,
      ranking: topics.length + 1,
    })
    setShowCreate(false)
  }

  async function handleUpdate(values: TopicFormValues) {
    if (!editingId) return
    await updateMutation.mutateAsync({
      id: editingId,
      ...values,
    })
    setEditingId(null)
  }

  function applyOptimisticReorder(oldIndex: number, newIndex: number) {
    const source = optimisticTopics ?? serverTopics
    const reordered = arrayMove([...source], oldIndex, newIndex).map(
      (topic, i) => ({ ...topic, ranking: i + 1 }),
    )
    setOptimisticTopics(reordered)
    pendingReorders.current += 1
    return newIndex + 1 // new ranking (1-indexed)
  }

  function handleMoveUp(id: string) {
    const index = topics.findIndex((t) => t._id === id)
    if (index <= 0) return
    const newRanking = applyOptimisticReorder(index, index - 1)
    markAsMoved(id, 'up')
    reorderMutation.mutate({ id: id as Id<'topics'>, newRanking })
  }

  function handleMoveDown(id: string) {
    const index = topics.findIndex((t) => t._id === id)
    if (index === -1 || index >= topics.length - 1) return
    const newRanking = applyOptimisticReorder(index, index + 1)
    markAsMoved(id, 'down')
    reorderMutation.mutate({ id: id as Id<'topics'>, newRanking })
  }

  function handleRemove(id: string) {
    if (!confirm('Remove this topic from the leaderboard?')) return
    removeMutation.mutate({ id: id as Id<'topics'> })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = topics.findIndex((t) => t._id === active.id)
    const newIndex = topics.findIndex((t) => t._id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newRanking = applyOptimisticReorder(oldIndex, newIndex)
    reorderMutation.mutate({ id: active.id as Id<'topics'>, newRanking })
  }

  const topicIds = topics.map((t) => t._id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Leaderboard Management</h1>
        <Button onClick={() => setShowCreate(true)}>Add Leaderboard Entry</Button>
      </div>

      {topics.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No topics yet. Add one to get started.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={topicIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {topics.map((topic, index) => (
                <SortableTopicItem
                  key={topic._id}
                  id={topic._id}
                  ranking={topic.ranking}
                  title={topic.title}
                  description={topic.description}
                  isFirst={index === 0}
                  isLast={index === topics.length - 1}
                  moveDirection={movedItem?.id === topic._id ? movedItem.direction : null}
                  onEdit={(id) => setEditingId(id as Id<'topics'>)}
                  onRemove={handleRemove}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Topic</DialogTitle>
          </DialogHeader>
          <TopicForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            submitLabel="Create"
            isSubmitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingId}
        onOpenChange={(open) => {
          if (!open) setEditingId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
          </DialogHeader>
          {editingTopic && (
            <TopicForm
              key={editingId}
              initialValues={{
                title: editingTopic.title,
                description: editingTopic.description,
                youtubeUrl: editingTopic.youtubeUrl,
                submittedBy: editingTopic.submittedBy,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditingId(null)}
              submitLabel="Save Changes"
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
