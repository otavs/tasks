import { useHover } from '@hooks/useHover'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Spinner } from './icons/Spinner'

export function VortexCheck() {
  const { ref, hovered } = useHover<HTMLDivElement>()

  return (
    <motion.div ref={ref} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full">
      {hovered ? (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Check size={30} color="#15ae97" />
        </motion.div>
      ) : (
        <Spinner />
      )}
    </motion.div>
  )
}
