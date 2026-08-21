import { cn } from "#/lib/utils.ts"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("t-skel rounded-md", className)}
      {...props}
    >
      <div className="t-skel-skeleton is-pulsing">
        <div className="size-full rounded-[inherit] bg-muted/70" />
      </div>
    </div>
  )
}

export { Skeleton }
