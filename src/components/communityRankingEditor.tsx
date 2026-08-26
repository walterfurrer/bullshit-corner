import {
  type ButtonHTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { LayoutGroup, motion, useReducedMotion } from 'motion/react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
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
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  DotsSixVerticalIcon,
  MinusIcon,
  PlusIcon,
} from '@phosphor-icons/react'
import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'

import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'
import { AnimatedStatus } from '#/components/ui/animatedStatus'
import { AlertDescription, AlertTitle } from '#/components/ui/alert'
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
import { getMotionTransition } from '#/lib/motion'
import { cn } from '#/lib/utils'

type EntryId = Id<'bullshitCornerEntries'>

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

function EntryRow({
  entry,
  position,
  ranked,
  onRank,
  onUnrank,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
  draggable = false,
  isDragging = false,
  dragHandleProps,
  motionId,
}: {
  entry: RankableCommunityEntry
  position?: number
  ranked: boolean
  onRank: (id: EntryId) => void
  onUnrank: (id: EntryId) => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  onMoveUp?: (id: EntryId) => void
  onMoveDown?: (id: EntryId) => void
  draggable?: boolean
  isDragging?: boolean
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>
  motionId?: string
}) {
  const prefersReducedMotion = useReducedMotion()
  const transition = getMotionTransition(prefersReducedMotion)

  return (
    <motion.div
      layout={isDragging ? false : 'position'}
      layoutId={isDragging ? undefined : motionId}
      transition={{ layout: transition }}
      className={cn(
        'grid min-w-0 items-center gap-2 px-3 py-3 transition-colors hover:bg-accent/30 focus-within:bg-accent/30 sm:gap-3 sm:px-4',
        isDragging && 'relative z-10 rounded-md bg-card shadow-md ring-1 ring-primary/30',
        ranked
          ? 'grid-cols-[2rem_auto_minmax(0,1fr)_auto] sm:grid-cols-[2.25rem_auto_minmax(0,1fr)_auto]'
          : 'grid-cols-[minmax(0,1fr)_2rem]',
      )}
    >
      {draggable ? (
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none rounded-xs p-1.5 text-muted-foreground hover:text-foreground focus-visible:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring/50 active:cursor-grabbing"
          aria-label={`Drag ${entry.title}`}
          {...dragHandleProps}
        >
          <DotsSixVerticalIcon size={20} aria-hidden="true" />
        </button>
      ) : null}
      {ranked && position ? <PositionBadge position={position} className="shrink-0" /> : null}
      <span className="min-w-0 break-words text-pretty font-medium text-foreground">
        {entry.title}
      </span>
      {ranked ? (
        <div className="flex shrink-0 items-center gap-1 justify-self-end">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Move ${entry.title} up in your ranking`}
            disabled={!canMoveUp}
            onClick={() => onMoveUp?.(entry.id)}
          >
            <ArrowUpIcon data-icon="inline-start" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Move ${entry.title} down in your ranking`}
            disabled={!canMoveDown}
            onClick={() => onMoveDown?.(entry.id)}
          >
            <ArrowDownIcon data-icon="inline-start" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${entry.title} from your ranking`}
            onClick={() => onUnrank(entry.id)}
          >
            <MinusIcon data-icon="inline-start" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="justify-self-end"
          aria-label={`Rank ${entry.title}`}
          onClick={() => onRank(entry.id)}
        >
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
        </Button>
      )}
    </motion.div>
  )
}

function SortableEntry({
  entry,
  position,
  onRank,
  onUnrank,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  entry: RankableCommunityEntry
  position?: number
  onRank: (id: EntryId) => void
  onUnrank: (id: EntryId) => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  onMoveUp?: (id: EntryId) => void
  onMoveDown?: (id: EntryId) => void
}) {
  return (
    <SortableListItem id={entry.id}>
      {({ attributes, listeners, setNodeRef, transform, transition, isDragging }) => {
        return (
          <li
            ref={setNodeRef}
            style={{
              transform: CSS.Transform.toString(transform),
              transition,
            }}
            {...attributes}
          >
            <EntryRow
              entry={entry}
              position={position}
              ranked
              onRank={onRank}
              onUnrank={onUnrank}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              draggable
              isDragging={isDragging}
              dragHandleProps={listeners}
              motionId={`community-ranking-${entry.id}`}
            />
          </li>
        )
      }}
    </SortableListItem>
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

  function moveEntry(id: EntryId, direction: 'up' | 'down') {
    setRankedEntryIds((current) => {
      const currentIndex = current.indexOf(id)
      const nextIndex = currentIndex + (direction === 'up' ? -1 : 1)

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= current.length) return current

      const next = [...current]
      const entryToMove = next[currentIndex]
      next[currentIndex] = next[nextIndex]
      next[nextIndex] = entryToMove
      return next
    })
    setFeedback(null)
    setError(null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return

    const activeIndex = rankedEntryIds.indexOf(active.id as EntryId)
    const overIndex = rankedEntryIds.indexOf(over.id as EntryId)
    if (activeIndex < 0 || overIndex < 0) return

    setRankedEntryIds((current) => arrayMove(current, activeIndex, overIndex))
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
    <Card className="xl:relative xl:left-1/2 xl:w-[min(100vw-3rem,80rem)] xl:-translate-x-1/2">
      <CardHeader>
        <CardTitle className="text-xl/7 font-semibold tracking-normal">
          Your rankings
        </CardTitle>
        <CardDescription>
          Rank as many entries as you like. Unranked entries are treated as no opinion.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LayoutGroup id="community-ranking">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(22rem,1fr)] xl:gap-8">
            <section className="flex flex-col gap-3" aria-labelledby="your-ranked-entries">
              <div>
                <h3 id="your-ranked-entries" className="text-lg/6 font-semibold tracking-normal">
                  Ranked entries
                </h3>
                <p className="text-sm text-muted-foreground">Drag to reorder or use the arrow buttons.</p>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                {rankedEntries.length > 0 ? (
                  <SortableContext items={rankedEntryIds} strategy={verticalListSortingStrategy}>
                    <ol className="glass-collection overflow-hidden rounded-xl divide-y divide-border">
                      {rankedEntries.map((entry, index) => (
                        <SortableEntry
                          key={entry.id}
                          entry={entry}
                          position={index + 1}
                          onRank={addEntry}
                          onUnrank={removeEntry}
                          canMoveUp={index > 0}
                          canMoveDown={index < rankedEntries.length - 1}
                          onMoveUp={(id) => moveEntry(id, 'up')}
                          onMoveDown={(id) => moveEntry(id, 'down')}
                        />
                      ))}
                    </ol>
                  </SortableContext>
                ) : (
                  <p className="glass-collection rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
                    Add at least one entry to create your ranking.
                  </p>
                )}
              </DndContext>
            </section>

            <section
              className="flex flex-col gap-3 xl:sticky xl:top-6 xl:self-start"
              aria-labelledby="unranked-entries"
            >
              <div>
                <h3
                  id="unranked-entries"
                  className="text-lg/6 font-semibold tracking-normal"
                >
                  Available entries
                </h3>
                <p className="text-sm text-muted-foreground">Choose only the entries you want to rank.</p>
              </div>
              <ol className="glass-collection max-h-120 overflow-y-auto rounded-xl divide-y divide-border xl:max-h-[min(34rem,calc(100dvh-20rem))]">
                {unrankedEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="min-w-0 hover:bg-accent/30 focus-within:bg-accent/30"
                  >
                    <EntryRow
                      entry={entry}
                      ranked={false}
                      onRank={addEntry}
                      onUnrank={removeEntry}
                      motionId={`community-ranking-${entry.id}`}
                    />
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </LayoutGroup>

        <AnimatedStatus show={!!feedback} variant="success" role="status">
          {feedback ? (
            <AlertDescription>{feedback}</AlertDescription>
          ) : null}
        </AnimatedStatus>
        <AnimatedStatus show={!!error} variant="destructive">
          {error ? (
            <>
              <AlertTitle>Couldn’t update your ranking</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </>
          ) : null}
        </AnimatedStatus>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          disabled={clearMutation.isPending || saveMutation.isPending || persistedEntryIds.length === 0}
          onClick={() => void handleClear()}
        >
          Clear rankings
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
