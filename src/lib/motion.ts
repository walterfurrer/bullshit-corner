import type { Transition } from 'motion/react'

const smoothOut = [0.22, 1, 0.36, 1] as const

export const motionDuration = {
  quick: 0.15,
  fast: 0.25,
} as const

export const fadeBlur = {
  initial: { opacity: 0, filter: 'blur(2px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
} as const

export const compactListItem = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4, height: 0 },
} as const

/** Returns the app's shared Motion timing with a zero-motion fallback. */
export function getMotionTransition(
  prefersReducedMotion: boolean | null,
  duration: number = motionDuration.fast,
): Transition {
  return prefersReducedMotion
    ? { duration: 0 }
    : { duration, ease: smoothOut }
}
