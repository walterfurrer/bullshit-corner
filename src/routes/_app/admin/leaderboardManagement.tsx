import { useCallback, useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
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

import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'

type PromoteSearchParams = {
  promoteSubmissionId?: string
  promoteTitle?: string
  promoteYoutubeUrl?: string
  promoteSubmittedBy?: string
}

const topicsQuery = convexQuery(api.admin.topics.list, {})

export const Route = createFileRoute('/_app/admin/leaderboardManagement')({
  validateSearch: (search: Record<string, unknown>): PromoteSearchParams => ({
    promoteSubmissionId: search.promoteSubmissionId as string | undefined,
    promoteTitle: search.promoteTitle as string | undefined,
    promoteYoutubeUrl: search.promoteYoutubeUrl as string | undefined,
    promoteSubmittedBy: search.promoteSubmittedBy as string | undefined,
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(topicsQuery)
  },
  component: LeaderboardManagement,
})

function LeaderboardManagement() {
  const { data: serverTopics } = useSuspenseQuery(topicsQuery)
  const [editingId, setEditingId] = useState<Id<'bullshitCornerEntries'> | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  // Promote flow — detect search params from submissions page
  const {
    promoteSubmissionId,
    promoteTitle,
    promoteYoutubeUrl,
    promoteSubmittedBy,
  } = Route.useSearch()
  const navigate = useNavigate()
  const [showPromote, setShowPromote] = useState(false)

  // Auto-open promote dialog when search params arrive
  useEffect(() => {
    if (promoteSubmissionId && promoteTitle) {
      setShowPromote(true)
    }
  }, [promoteSubmissionId, promoteTitle])

  function closePromoteDialog() {
    setShowPromote(false)
    // Clear search params
    navigate({
      to: '/admin/leaderboardManagement',
      search: {},
      replace: true,
    })
  }

  // Reorder mode — shows drag handles + up/down buttons on mobile
  const [reorderMode, setReorderMode] = useState(false)

  // Snapshot of server order when entering reorder mode (for cancel)
  const orderSnapshotRef = useRef<typeof serverTopics | null>(null)

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
      if (pendingReorders.current <= 0) {
        pendingReorders.current = 0
        setOptimisticTopics(null)
      }
    },
  })

  const promoteMutation = useMutation({
    mutationFn: useConvexMutation(api.admin.submissions.promote),
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

  async function handlePromote(values: TopicFormValues) {
    if (!promoteSubmissionId || !values.ranking) return
    await promoteMutation.mutateAsync({
      id: promoteSubmissionId as Id<'submissions'>,
      ranking: values.ranking,
    })
    closePromoteDialog()
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
    return newIndex + 1
  }

  function handleMoveUp(id: string) {
    const index = topics.findIndex((t) => t._id === id)
    if (index <= 0) return
    const newRanking = applyOptimisticReorder(index, index - 1)
    markAsMoved(id, 'up')
    reorderMutation.mutate({ id: id as Id<'bullshitCornerEntries'>, newRanking })
  }

  function handleMoveDown(id: string) {
    const index = topics.findIndex((t) => t._id === id)
    if (index === -1 || index >= topics.length - 1) return
    const newRanking = applyOptimisticReorder(index, index + 1)
    markAsMoved(id, 'down')
    reorderMutation.mutate({ id: id as Id<'bullshitCornerEntries'>, newRanking })
  }

  function handleRemove(id: string) {
    if (!confirm('Remove this topic from the leaderboard?')) return
    removeMutation.mutate({ id: id as Id<'bullshitCornerEntries'> })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = topics.findIndex((t) => t._id === active.id)
    const newIndex = topics.findIndex((t) => t._id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newRanking = applyOptimisticReorder(oldIndex, newIndex)
    reorderMutation.mutate({ id: active.id as Id<'bullshitCornerEntries'>, newRanking })
  }

  const topicIds = topics.map((t) => t._id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-racing-compact">
          Leaderboard Management
        </h1>
        {reorderMode ? (
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Cancel — revert to the snapshot taken when entering reorder mode
                setOptimisticTopics(null)
                setReorderMode(false)
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => setReorderMode(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {topics.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => {
                  orderSnapshotRef.current = [...serverTopics]
                  setReorderMode(true)
                }}
              >
                Reorder
              </Button>
            )}
            <Button onClick={() => setShowCreate(true)}>
              <span className="hidden sm:inline">Add Leaderboard Entry</span>
              <span className="sm:hidden">Add Entry</span>
            </Button>
          </div>
        )}
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
            <ol className="glass-collection overflow-hidden rounded-xl divide-y divide-border">
              {topics.map((topic, index) => (
                <SortableTopicItem
                  key={topic._id}
                  id={topic._id}
                  ranking={topic.ranking}
                  title={topic.title}
                  isFirst={index === 0}
                  isLast={index === topics.length - 1}
                  reorderMode={reorderMode}
                  moveDirection={movedItem?.id === topic._id ? movedItem.direction : null}
                  onEdit={(id) => setEditingId(id as Id<'bullshitCornerEntries'>)}
                  onRemove={handleRemove}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />
              ))}
            </ol>
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

      {/* Promote Dialog — auto-opened when navigating from submissions */}
      <Dialog
        open={showPromote}
        onOpenChange={(open) => {
          if (!open) closePromoteDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote to Leaderboard</DialogTitle>
          </DialogHeader>
          <TopicForm
            key={promoteSubmissionId}
            initialValues={{
              title: promoteTitle ?? '',
              ranking: topics.length + 1,
              youtubeUrl: promoteYoutubeUrl,
              submittedBy: promoteSubmittedBy,
            }}
            showRanking
            maxRanking={topics.length + 1}
            onSubmit={handlePromote}
            onCancel={closePromoteDialog}
            submitLabel="Promote"
            isSubmitting={promoteMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
