import { motion } from 'framer-motion'
import { useMemo } from 'react'

import { rainbowCycle } from '@/utils/rainbow'

/** A spinning arc that slowly cycles through the rainbow: "I'm working on it". */
export function LoadingRing() {
  const colors = useMemo(rainbowCycle, [])

  return (
    <motion.svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      initial={{ scale: 0 }}
      animate={{ scale: 1, rotate: 360 }}
      transition={{
        scale: { type: 'spring', stiffness: 400, damping: 20 },
        rotate: { repeat: Infinity, duration: 0.9, ease: 'linear' },
      }}
    >
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-15" />
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength={1}
        initial={{ strokeDasharray: '0.28 1' }}
        animate={{ stroke: colors, strokeDasharray: ['0.12 1', '0.5 1', '0.12 1'] }}
        transition={{
          stroke: { repeat: Infinity, duration: 4.5, ease: 'linear' },
          strokeDasharray: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' },
        }}
      />
    </motion.svg>
  )
}
