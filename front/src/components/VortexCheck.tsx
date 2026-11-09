import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'

import { Spinner } from './icons/Spinner'

/** The rainbow vortex that turns into a check mark when you're about to complete a task. */
export function VortexCheck({ active }: { active: boolean }) {
  return (
    <div className="relative grid size-8 place-items-center">
      <AnimatePresence initial={false} mode="popLayout">
        {active ? (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="grid size-8 place-items-center rounded-full bg-check/15"
          >
            <Check size={22} strokeWidth={3} className="text-check" />
          </motion.div>
        ) : (
          <motion.div
            key="vortex"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.12 } }}
          >
            <Spinner />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
