import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { Spinner } from './icons/Spinner.tsx'

export function VortexCheck() {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!hovered ? (
        <Spinner />
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
