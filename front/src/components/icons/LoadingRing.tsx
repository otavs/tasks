import { motion } from 'framer-motion'
import { CSSProperties, memo, useState } from 'react'

import { rainbowStyle } from '@/utils/rainbow'

/**
 * A spinning arc that slowly cycles through the rainbow: "I'm working on it".
 * CSS animations (see `.spin` and `.rainbow-stroke` in index.css), so they cost no JavaScript per frame.
 */
export const LoadingRing = memo(function LoadingRing() {
  const [colors] = useState(() => rainbowStyle(4.5))

  return (
    <motion.span
      className="block size-6"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="spin block"
        style={{ '--spin-duration': '0.9s' } as CSSProperties}
      >
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-15" />
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={1}
          className="rainbow-stroke"
          style={colors}
        />
      </svg>
    </motion.span>
  )
})
