import { LayoutGroup, motion, useReducedMotion, type Transition } from 'motion/react'
import { createContext, useContext, useId, useState, type ReactNode } from 'react'

import { getMotionTransition } from '#/lib/motion'

interface HighlightContextValue {
  activeId: string | null
  layoutId: string
  setActiveId: (id: string | null) => void
  transition: Transition
}

const HighlightContext = createContext<HighlightContextValue | null>(null)

interface MotionHighlightProviderProps {
  children: (controls: { clear: () => void }) => ReactNode
  id: string
}

/** Coordinates a single layout-animated highlight inside a popup. */
export function MotionHighlightProvider({
  children,
  id,
}: MotionHighlightProviderProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const transition = getMotionTransition(prefersReducedMotion)

  return (
    <HighlightContext.Provider value={{ activeId, layoutId: id, setActiveId, transition }}>
      <LayoutGroup id={id}>
        {children({ clear: () => setActiveId(null) })}
      </LayoutGroup>
    </HighlightContext.Provider>
  )
}

/** Supplies item handlers and the moving accent surface for popup menu items. */
export function useMotionHighlightItem() {
  const context = useContext(HighlightContext)
  const id = useId()

  if (!context) {
    return { activate: () => undefined, indicator: null }
  }

  return {
    activate: () => context.setActiveId(id),
    indicator: context.activeId === id ? (
      <motion.span
        aria-hidden="true"
        className="t-motion-menu-highlight"
        layoutId={`${context.layoutId}-highlight`}
        transition={{ layout: context.transition }}
      />
    ) : null,
  }
}
