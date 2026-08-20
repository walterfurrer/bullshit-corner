import { RankingBoard } from '#/components/rankingBoard'

import type { RankableCommunityEntry } from './communityRankingEditor'

interface CommunityLeaderboardEntry extends RankableCommunityEntry {
  youtubeUrl?: string
  submittedBy?: string
  rankedBy: number
}

export function CommunityLeaderboard({ entries }: { entries: CommunityLeaderboardEntry[] }) {
  if (entries.every((entry) => entry.rankedBy === 0)) {
    return (
      <p className="glass-section rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
        No community rankings yet. Be the first person to rank the board.
      </p>
    )
  }

  return (
    <RankingBoard
      entries={entries.map((entry, index) => ({
        id: entry.id,
        position: index + 1,
        title: entry.title,
        youtubeUrl: entry.youtubeUrl,
        metadata: (
          <p className="font-mono text-xs text-muted-foreground">
            Ranked by {entry.rankedBy} {entry.rankedBy === 1 ? 'member' : 'members'}
          </p>
        ),
      }))}
    />
  )
}
