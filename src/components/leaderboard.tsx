import type { Doc } from '#convex/_generated/dataModel'
import { RankingBoard } from '#/components/rankingBoard'

export function Leaderboard({ topics }: { topics: Array<Doc<'bullshitCornerEntries'>> }) {
  return (
    <div className="flex flex-col gap-2">
      <h2>HPR's Rankings</h2>
      <RankingBoard
        entries={topics.map((topic, index) => ({
          id: topic._id,
          position: index + 1,
          title: topic.title,
          youtubeUrl: topic.youtubeUrl,
          metadata: topic.submittedBy ? (
            <p className="font-mono text-xs text-muted-foreground">
              Submitted by {topic.submittedBy}
            </p>
          ) : undefined,
        }))}
      />
    </div>
  )
}
