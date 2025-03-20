import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useState } from 'react'

const PARTICLE_COUNT = 30

export function VortexCheck() {
  const [hovered, setHovered] = useState(false)

  const particles = Array.from({ length: PARTICLE_COUNT })

  return (
    <motion.div
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!hovered ? (
        <motion.svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ pointerEvents: 'none' }}
        >
          {particles.map((_, i) => {
            const angle = (i / PARTICLE_COUNT) * Math.PI * 6 // Spiral effect
            const radius = -40 - (i / PARTICLE_COUNT) * 40 // Moves inward
            const x = 50 + Math.cos(angle) * radius
            const y = 50 + Math.sin(angle) * radius

            return (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                fill={`#000000`}
                initial={{ opacity: 0 }}
                animate={{
                  cx: [x, 50],
                  cy: [y, 50],
                  opacity: [0, 1],
                  scale: [1, 0.9],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.05,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            )
          })}
        </motion.svg>
      ) : (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Check size={30} color="#15ae97" />
        </motion.div>
      )}
    </motion.div>
  )
}
