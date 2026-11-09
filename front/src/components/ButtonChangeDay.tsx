import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/utils/cn'

export function ButtonChangeDay({ dir, onClick }: { dir: -1 | 1; onClick: () => void }) {
  const Icon = dir < 0 ? ChevronLeft : ChevronRight
  const label = dir < 0 ? 'Previous day' : 'Next day'

  return (
    <motion.button
      type="button"
      aria-label={label}
      title={`${label} (${dir < 0 ? '←' : '→'})`}
      onClick={onClick}
      whileTap={{ scale: 0.86 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className="group grid size-11 shrink-0 sm:size-12 cursor-pointer place-items-center rounded-full border-2 border-transparent bg-primary text-primary-ink shadow-card transition-colors hover:border-primary-ring"
    >
      <Icon
        strokeWidth={2.75}
        className={cn(
          'size-5 transition-transform duration-200',
          dir < 0 ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'
        )}
      />
    </motion.button>
  )
}
