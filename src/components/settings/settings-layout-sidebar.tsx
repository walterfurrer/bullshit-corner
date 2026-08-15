import { useState, useEffect, type ReactNode } from 'react'

import { cn } from '#/lib/utils.ts'

interface SettingsSection {
  id: string
  label: string
  content: ReactNode
}

interface SettingsLayoutSidebarProps {
  sections: SettingsSection[]
}

export function SettingsLayoutSidebar({ sections }: SettingsLayoutSidebarProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? '')

  // Sync activeSection if sections change and current is gone
  useEffect(() => {
    if (sections.length > 0 && !sections.some((s) => s.id === activeSection)) {
      setActiveSection(sections[0].id)
    }
  }, [sections, activeSection])

  const activeContent = sections.find((s) => s.id === activeSection)?.content

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-8">
      {/* Sidebar — vertical on desktop, horizontal scroll on mobile */}
      <nav
        aria-label="Settings sections"
        className="shrink-0 md:w-48 lg:w-56"
      >
        {/* Mobile: horizontal scrollable tab bar */}
        <ul className="flex gap-1 overflow-x-auto pb-2 md:flex-col md:gap-0.5 md:overflow-x-visible md:pb-0">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full whitespace-nowrap rounded-md px-3 py-2 text-start text-sm font-medium transition-colors',
                  activeSection === section.id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
                aria-current={activeSection === section.id ? 'page' : undefined}
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content area */}
      <div className="min-w-0 flex-1">{activeContent}</div>
    </div>
  )
}
