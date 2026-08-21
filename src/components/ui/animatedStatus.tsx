import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type * as React from 'react'

import { getMotionTransition, motionDuration } from '#/lib/motion'

import { Alert } from './alert'

interface AnimatedStatusProps extends React.ComponentProps<typeof Alert> {
  show: boolean
}

/** An alert that enters and leaves without leaving an empty live region behind. */
function AnimatedStatus({ show, ...props }: AnimatedStatusProps) {
  const prefersReducedMotion = useReducedMotion()
  const transition = getMotionTransition(prefersReducedMotion, motionDuration.quick)

  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.div
          initial={{ opacity: 0, y: 4, filter: 'blur(2px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -4, filter: 'blur(2px)' }}
          transition={transition}
        >
          <Alert {...props} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export { AnimatedStatus }
