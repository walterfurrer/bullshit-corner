import { LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { useState, type ReactNode } from 'react'

import { getMotionTransition } from '#/lib/motion'
import { cn } from '#/lib/utils'

interface SectionNavigationItem {
  label: string
  value: string
}

interface SectionNavigationProps {
  activeValue: string
  ariaLabel: string
  id: string
  items: readonly SectionNavigationItem[]
  orientation?: 'horizontal' | 'vertical'
  renderItem: (item: SectionNavigationItem, isActive: boolean) => ReactNode
}

/** Shared desktop section navigation with layout-animated hover and active rails. */
export function SectionNavigation({
  activeValue,
  ariaLabel,
  id,
  items,
  orientation = 'vertical',
  renderItem,
}: SectionNavigationProps) {
  const [hoveredValue, setHoveredValue] = useState<string | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const transition = getMotionTransition(prefersReducedMotion)

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'section-nav hidden md:block',
        orientation === 'horizontal' && 'section-nav-horizontal',
      )}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setHoveredValue(null)
        }
      }}
      onPointerLeave={() => setHoveredValue(null)}
    >
      <LayoutGroup id={id}>
        <ul className="section-nav-list">
          {items.map((item) => {
            const isActive = item.value === activeValue
            const isHovered = item.value === hoveredValue

            return (
              <li
                key={item.value}
                className="relative"
                onFocusCapture={() => setHoveredValue(item.value)}
                onPointerEnter={() => setHoveredValue(item.value)}
              >
                {isHovered && (
                  <motion.span
                    aria-hidden="true"
                    className="t-section-nav-hover"
                    layoutId={`${id}-hover`}
                    transition={{ layout: transition }}
                  />
                )}
                {isActive && (
                  <motion.span
                    aria-hidden="true"
                    className="t-section-nav-active"
                    layoutId={`${id}-active`}
                    transition={{ layout: transition }}
                  />
                )}
                {renderItem(item, isActive)}
              </li>
            )
          })}
        </ul>
      </LayoutGroup>
    </nav>
  )
}
