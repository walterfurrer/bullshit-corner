import { Badge } from '#/components/ui/badge.tsx'
import { cn } from '#/lib/utils.ts'

function positionStyles(position: number) {
  if (position === 1) return 'bg-gold text-background'
  if (position === 2) return 'bg-silver text-background'
  if (position === 3) return 'bg-bronze text-background'
  return 'border border-border bg-muted text-muted-foreground'
}

interface PositionBadgeProps {
  position: number
  className?: string
}

export function PositionBadge({ position, className }: PositionBadgeProps) {
  return (
    <Badge
      className={cn(
        'font-racing h-8 w-12 rounded-md text-base tracking-wide',
        positionStyles(position),
        className,
      )}
    >
      P{position}
    </Badge>
  )
}
