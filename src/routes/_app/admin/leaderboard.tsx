import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import {
  TopicForm,
  type TopicFormValues,
} from '#/components/admin/topic-form.tsx'
import { TopicListItem } from '#/components/admin/topic-list-item.tsx'
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

export const Route = createFileRoute('/_app/admin/leaderboard')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(topicsQuery)
  },
  component: LeaderboardManagement,
})

function LeaderboardManagement() {
  const { data: topics } = useSuspenseQuery(topicsQuery)
  const [editingId, setEditingId] = useState<Id<'topics'> | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const createMutation = useMutation({
    mutationFn: useConvexMutation(api.admin.topics.create),
  })
  const updateMutation = useMutation({
    mutationFn: useConvexMutation(api.admin.topics.update),
  })
  const removeMutation = useMutation({
    mutationFn: useConvexMutation(api.admin.topics.remove),
  })
  const reorderMutation = useMutation({
    mutationFn: useConvexMutation(api.admin.topics.reorder),
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

  function handleMoveUp(id: string) {
    const topic = topics.find((t) => t._id === id)
    if (!topic || topic.ranking <= 1) return
    reorderMutation.mutate({
      id: id as Id<'topics'>,
      newRanking: topic.ranking - 1,
    })
  }

  function handleMoveDown(id: string) {
    const topic = topics.find((t) => t._id === id)
    if (!topic || topic.ranking >= topics.length) return
    reorderMutation.mutate({
      id: id as Id<'topics'>,
      newRanking: topic.ranking + 1,
    })
  }

  function handleRemove(id: string) {
    if (!confirm('Remove this topic from the leaderboard?')) return
    removeMutation.mutate({ id: id as Id<'topics'> })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Leaderboard Management</h1>
        <Button onClick={() => setShowCreate(true)}>Add Topic</Button>
      </div>

      {topics.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No topics yet. Add one to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {topics.map((topic, index) => (
            <TopicListItem
              key={topic._id}
              id={topic._id}
              ranking={topic.ranking}
              title={topic.title}
              description={topic.description}
              isFirst={index === 0}
              isLast={index === topics.length - 1}
              onEdit={(id) => setEditingId(id as Id<'topics'>)}
              onRemove={handleRemove}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))}
        </div>
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
