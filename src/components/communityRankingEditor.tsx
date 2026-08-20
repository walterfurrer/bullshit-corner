import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DotsSixVerticalIcon, MinusIcon, PlusIcon } from '@phosphor-icons/react'
import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'

import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { PositionBadge } from '#/components/positionBadge'
import { SortableListItem } from '#/components/sortableListItem'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { cn } from '#/lib/utils'

type EntryId = Id<'bullshitCornerEntries'>

const RANKED_DROP_ZONE = 'ranked-drop-zone'
const UNRANKED_DROP_ZONE = 'unranked-drop-zone'

export interface RankableCommunityEntry {
  id: EntryId
  title: string
  officialRanking: number
}

interface CommunityRankingEditorProps {
  entries: RankableCommunityEntry[]
  savedEntryIds: EntryId[]
}

function hasSameOrder(left: EntryId[], right: EntryId[]) {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

function SortableEntry({
  entry,
  position,
  ranked,
  onRank,
  onUnrank,
}: {
  entry: RankableCommunityEntry
  position?: number
  ranked: boolean
  onRank: (id: EntryId) => void
  onUnrank: (id: EntryId) => void
}) {
  return (
    <SortableListItem id={entry.id}>
      {({ attributes, listeners, setNodeRef, transform, transition, isDragging }) => (
        <li
          ref={setNodeRef}
          style={{ transform: CSS.Transform.toString(transform), transition }}
          className={cn(isDragging && 'opacity-50')}
          {...attributes}
        >
          <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
            <button
              type="button"
              className="shrink-0 cursor-grab touch-none rounded-xs p-1.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
              aria-label={`Drag ${entry.title}`}
              {...listeners}
            >
              <DotsSixVerticalIcon size={20} aria-hidden="true" />
            </button>
            {ranked && position ? (
              <PositionBadge position={position} className="shrink-0" />
            ) : (
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                HPR P{entry.officialRanking}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">
              {entry.title}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={ranked ? `Remove ${entry.title} from your ranking` : `Rank ${entry.title}`}
              onClick={() => (ranked ? onUnrank(entry.id) : onRank(entry.id))}
            >
              {ranked ? (
                <MinusIcon data-icon="inline-start" aria-hidden="true" />
              ) : (
                <PlusIcon data-icon="inline-start" aria-hidden="true" />
              )}
            </Button>
          </div>
        </li>
      )}
    </SortableListItem>
  )
}

function RankingDropZone({
  id,
  children,
}: {
  id: typeof RANKED_DROP_ZONE | typeof UNRANKED_DROP_ZONE
  children: React.ReactNode
}) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xs transition-colors',
        isOver && 'bg-primary/5 outline outline-2 outline-primary/30 outline-offset-2',
      )}
    >
      {children}
    </div>
  )
}

export function CommunityRankingEditor({
  entries,
  savedEntryIds,
}: CommunityRankingEditorProps) {
  const activeEntryIds = useMemo(() => new Set(entries.map((entry) => entry.id)), [entries])
  const activeEntryIdsKey = entries.map((entry) => entry.id).join(',')
  const savedIdsKey = savedEntryIds.join(',')
  const initialSavedEntryIds = useMemo(
    () => savedEntryIds.filter((id) => activeEntryIds.has(id)),
    [activeEntryIds, savedEntryIds],
  )
  const [rankedEntryIds, setRankedEntryIds] = useState<EntryId[]>(initialSavedEntryIds)
  const [persistedEntryIds, setPersistedEntryIds] = useState<EntryId[]>(initialSavedEntryIds)
  const persistedEntryIdsRef = useRef(initialSavedEntryIds)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const nextPersistedEntryIds = savedEntryIds.filter((id) => activeEntryIds.has(id))
    const previousPersistedEntryIds = persistedEntryIdsRef.current

    setRankedEntryIds((currentRankedEntryIds) =>
      hasSameOrder(currentRankedEntryIds, previousPersistedEntryIds)
        ? nextPersistedEntryIds
        : currentRankedEntryIds.filter((id) => activeEntryIds.has(id)),
    )
    persistedEntryIdsRef.current = nextPersistedEntryIds
    setPersistedEntryIds(nextPersistedEntryIds)
  }, [activeEntryIds, activeEntryIdsKey, savedEntryIds, savedIdsKey])

  const entryById = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    [entries],
  )
  const rankedEntries = rankedEntryIds.flatMap((id) => {
    const entry = entryById.get(id)
    return entry ? [entry] : []
  })
  const unrankedEntries = [...entries.filter((entry) => !rankedEntryIds.includes(entry.id))]
    .sort((left, right) => left.officialRanking - right.officialRanking)
  const isDirty = !hasSameOrder(rankedEntryIds, persistedEntryIds)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const saveMutation = useMutation({
    mutationFn: useConvexMutation(api.communityRankings.save),
  })
  const clearMutation = useMutation({
    mutationFn: useConvexMutation(api.communityRankings.clear),
  })

  function addEntry(id: EntryId) {
    setRankedEntryIds((current) => (current.includes(id) ? current : [...current, id]))
    setFeedback(null)
    setError(null)
  }

  function removeEntry(id: EntryId) {
    setRankedEntryIds((current) => current.filter((entryId) => entryId !== id))
    setFeedback(null)
    setError(null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return

    const activeId = active.id as EntryId
    const overId = over.id as EntryId | typeof RANKED_DROP_ZONE | typeof UNRANKED_DROP_ZONE
    const activeRankedIndex = rankedEntryIds.indexOf(activeId)
    const overRankedIndex = rankedEntryIds.indexOf(overId as EntryId)
    const targetIsRanked = overId === RANKED_DROP_ZONE || overRankedIndex >= 0

    if (activeRankedIndex >= 0 && targetIsRanked) {
      setRankedEntryIds((current) =>
        arrayMove(current, activeRankedIndex, overRankedIndex >= 0 ? overRankedIndex : current.length - 1),
      )
    } else if (activeRankedIndex >= 0 && !targetIsRanked) {
      removeEntry(activeId)
    } else if (activeRankedIndex < 0 && targetIsRanked) {
      setRankedEntryIds((current) => {
        const next = [...current]
        next.splice(overRankedIndex >= 0 ? overRankedIndex : next.length, 0, activeId)
        return next
      })
    }
  }

  async function handleSave() {
    if (rankedEntryIds.length === 0) return
    setFeedback(null)
    setError(null)

    try {
      const saved = await saveMutation.mutateAsync({ entryIds: rankedEntryIds })
      persistedEntryIdsRef.current = saved
      setPersistedEntryIds(saved)
      setFeedback('Your community ranking has been saved.')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to save your ranking.')
    }
  }

  async function handleClear() {
    setFeedback(null)
    setError(null)

    try {
      await clearMutation.mutateAsync({})
      persistedEntryIdsRef.current = []
      setPersistedEntryIds([])
      setRankedEntryIds([])
      setFeedback('Your community ranking has been cleared.')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to clear your ranking.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your ranking</CardTitle>
        <CardDescription>
          Rank as many entries as you like. Unranked entries are treated as no opinion.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="flex flex-col gap-3" aria-labelledby="your-ranked-entries">
              <div>
                <h3 id="your-ranked-entries" className="font-medium">Your ranking</h3>
                <p className="text-sm text-muted-foreground">Drag to reorder or use the remove button.</p>
              </div>
              <RankingDropZone id={RANKED_DROP_ZONE}>
                {rankedEntries.length > 0 ? (
                  <SortableContext items={rankedEntryIds} strategy={verticalListSortingStrategy}>
                    <ol className="flex flex-col gap-2">
                      {rankedEntries.map((entry, index) => (
                        <SortableEntry
                          key={entry.id}
                          entry={entry}
                          position={index + 1}
                          ranked
                          onRank={addEntry}
                          onUnrank={removeEntry}
                        />
                      ))}
                    </ol>
                  </SortableContext>
                ) : (
                  <p className="rounded-xs border border-dashed px-3 py-6 text-sm text-muted-foreground">
                    Add at least one entry to create your ranking.
                  </p>
                )}
              </RankingDropZone>
            </section>

            <section className="flex flex-col gap-3" aria-labelledby="unranked-entries">
              <div>
                <h3 id="unranked-entries" className="font-medium">Available entries</h3>
                <p className="text-sm text-muted-foreground">Choose only the entries you want to rank.</p>
              </div>
              <RankingDropZone id={UNRANKED_DROP_ZONE}>
                <SortableContext
                  items={unrankedEntries.map((entry) => entry.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ol className="flex max-h-120 flex-col gap-2 overflow-y-auto pe-1">
                    {unrankedEntries.map((entry) => (
                      <SortableEntry
                        key={entry.id}
                        entry={entry}
                        ranked={false}
                        onRank={addEntry}
                        onUnrank={removeEntry}
                      />
                    ))}
                  </ol>
                </SortableContext>
              </RankingDropZone>
            </section>
          </div>
        </DndContext>

        {feedback ? (
          <Alert variant="success" role="status">
            <AlertDescription>{feedback}</AlertDescription>
          </Alert>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Couldn’t update your ranking</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          disabled={clearMutation.isPending || saveMutation.isPending || persistedEntryIds.length === 0}
          onClick={() => void handleClear()}
        >
          Clear ranking
        </Button>
        <Button
          type="button"
          disabled={!isDirty || rankedEntryIds.length === 0 || saveMutation.isPending || clearMutation.isPending}
          onClick={() => void handleSave()}
        >
          {saveMutation.isPending ? 'Saving…' : 'Save ranking'}
        </Button>
      </CardFooter>
    </Card>
  )
}
