import { useState, useCallback, type ReactNode } from 'react'
import { StackIcon, SidebarIcon } from '@phosphor-icons/react'

import { Button } from '#/components/ui/button.tsx'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip.tsx'
import { SettingsLayoutStacked } from '#/components/settings/settings-layout-stacked.tsx'
import { SettingsLayoutSidebar } from '#/components/settings/settings-layout-sidebar.tsx'

const STORAGE_KEY = 'bs-settings-layout'

type LayoutMode = 'stacked' | 'sidebar'

function getStoredLayout(): LayoutMode {
  if (typeof window === 'undefined') return 'stacked'
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'sidebar' ? 'sidebar' : 'stacked'
}

export interface SettingsSection {
  id: string
  label: string
  content: ReactNode
}

interface SettingsLayoutSwitcherProps {
  sections: SettingsSection[]
}

export function SettingsLayoutSwitcher({ sections }: SettingsLayoutSwitcherProps) {
  const [layout, setLayout] = useState<LayoutMode>(getStoredLayout)

  const toggle = useCallback(() => {
    setLayout((prev) => {
      const next: LayoutMode = prev === 'stacked' ? 'sidebar' : 'stacked'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Dev-only layout toggle */}
      {import.meta.env.DEV && (
        <div className="flex justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={toggle}
                  className="gap-1.5 text-muted-foreground"
                >
                  {layout === 'stacked' ? (
                    <SidebarIcon className="size-3.5" aria-hidden="true" />
                  ) : (
                    <StackIcon className="size-3.5" aria-hidden="true" />
                  )}
                  Switch to {layout === 'stacked' ? 'sidebar' : 'stacked'}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                A/B layout toggle (dev only)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Render the active layout */}
      {layout === 'stacked' ? (
        <SettingsLayoutStacked sections={sections} />
      ) : (
        <SettingsLayoutSidebar sections={sections} />
      )}
    </div>
  )
}
