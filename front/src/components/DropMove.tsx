import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { useAtomValue } from 'jotai'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { dateAtom, isDraggingTaskAtom } from '@/state/state'
import { cn } from '@/utils/cn'
import { shiftDate, shortDayLabel } from '@/utils/date'

/** Drop zone on the side of the list: drop a task here to move it to the previous / next day. */
export function DropMove({ id, dir }: { id: string; dir: -1 | 1 }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  const isDraggingTask = useAtomValue(isDraggingTaskAtom)
  const date = useAtomValue(dateAtom)

  const Icon = dir < 0 ? ChevronLeft : ChevronRight

  return (
    <motion.div
      ref={setNodeRef}
      aria-hidden={!isDraggingTask}
      initial={false}
      animate={{
        opacity: isDraggingTask ? 1 : 0,
        scale: isOver ? 1.04 : isDraggingTask ? [0.97, 1, 0.97] : 0.95,
      }}
      transition={{
        opacity: { duration: isDraggingTask ? 0.35 : 0.2, ease: 'easeOut' },
        scale: isOver
          ? { type: 'spring', stiffness: 400, damping: 20 }
          : { duration: 2.4, repeat: isDraggingTask ? Infinity : 0, ease: 'easeInOut' },
      }}
      style={{ pointerEvents: isDraggingTask ? 'auto' : 'none' }}
      className={cn(
        'z-[1] mb-2.5 flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-zone-ink backdrop-blur-sm transition-colors duration-200 sm:w-[20%]',
        // On phones the zones float over the edges of the list instead of taking up width.
        'max-sm:absolute max-sm:top-0 max-sm:bottom-2.5 max-sm:w-12',
        dir < 0 ? 'max-sm:left-0' : 'max-sm:right-0',
        isOver ? 'border-zone-ink/50 bg-zone-over' : 'border-zone-ink/25 bg-zone/85'
      )}
    >
      <motion.div
        animate={isDraggingTask ? { x: [0, dir * 4, 0] } : { x: 0 }}
        transition={{ duration: isOver ? 0.6 : 1.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon className="size-5 sm:size-6" strokeWidth={2.75} />
      </motion.div>
      <div className="hidden text-center leading-tight sm:block">
        <div className="text-[11px] font-bold tracking-widest uppercase opacity-70">Move to</div>
        <div className="font-display text-base font-semibold">{shortDayLabel(shiftDate(date, dir))}</div>
      </div>
    </motion.div>
  )
}
