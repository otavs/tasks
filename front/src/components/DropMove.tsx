import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { useAtom } from 'jotai'

import { isDraggingTaskAtom } from '@/state/state'

export function DropMove({ id, dir, hide }: { id: string; dir: 'left' | 'right'; hide: boolean }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  const [isDraggingTask] = useAtom(isDraggingTaskAtom)

  const duration = isOver ? 0.1 : isDraggingTask ? 3 : 0.3

  if (hide) return

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, scale: 0.95, backgroundColor: '#bbf7d0' }}
      animate={{
        opacity: isDraggingTask ? 1 : 0,
        scale: isDraggingTask ? [0.95, 1, 0.95] : 0.95,
        backgroundColor: isOver ? '#86efac' : '#bbf7d0',
      }}
      transition={{
        opacity: { duration, ease: 'easeIn' },
        scale: { duration: 3, repeat: Infinity, ease: 'linear' },
        backgroundColor: { duration: 0.3, ease: 'easeInOut' },
      }}
      className={`flex w-[8%] items-center justify-center rounded-2xl sm:w-[20%] ${isOver && 'cursor-pointer'}`}
      style={{ pointerEvents: isDraggingTask ? 'auto' : 'none' }}
    >
      {dir === 'left' ? '←' : '→'}
    </motion.div>
  )
}
