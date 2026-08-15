import type { ReactNode } from 'react'

interface SettingsSection {
  id: string
  label: string
  content: ReactNode
}

interface SettingsLayoutStackedProps {
  sections: SettingsSection[]
}

export function SettingsLayoutStacked({ sections }: SettingsLayoutStackedProps) {
  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section.id} id={`section-${section.id}`}>
          {section.content}
        </div>
      ))}
    </div>
  )
}
