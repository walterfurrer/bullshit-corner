import { DiscordLogoIcon, XLogoIcon } from '@phosphor-icons/react'

import { Separator } from '#/components/ui/separator.tsx'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip.tsx'
import { useCopyToClipboard } from '#/hooks/useCopyToClipboard'

const DISCORD_USERNAME = 'walterfurrer'

export function SiteFooter() {
  const { copied, copy } = useCopyToClipboard()

  return (
    <footer className="mt-10 flex flex-col gap-4 sm:mt-14">
      <p className="text-center text-xs text-muted-foreground">
        bscorner.com is an unofficial fan site for the High Performance Racing podcast.
      </p>
      <Separator className="pt-0.5 opacity-50" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <p>
          Built by{' '}
          <a
            href="https://github.com/walterfurrer"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Walter Furrer
          </a>
        </p>

        <TooltipProvider>
          <div className="flex items-center gap-3">
            <a
              href="https://x.com/waltercodes"
              target="_blank"
              rel="noreferrer"
              aria-label="Walter Furrer on X"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <XLogoIcon size={24} weight="regular" />
            </a>

            <Tooltip open={copied || undefined}>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => copy(DISCORD_USERNAME)}
                    aria-label="Copy Discord username to clipboard"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  />
                }
              >
                <DiscordLogoIcon size={24} weight="regular" />
              </TooltipTrigger>
              <TooltipContent>{copied ? 'Copied!' : DISCORD_USERNAME}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </footer>
  )
}
