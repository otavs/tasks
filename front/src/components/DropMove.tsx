import { useDroppable } from '@dnd-kit/core'
import { isDraggingTaskAtom } from '../state.ts'
import { useAtom } from 'jotai'
import { motion } from 'framer-motion'

export function DropMove({ id, dir }: { id: string; dir: 'left' | 'right' }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  const [isDraggingTask] = useAtom(isDraggingTaskAtom)

  const duration = isOver ? 0.1 : isDraggingTask ? 3 : 0.3

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
      className={`flex w-[5%] sm:w-[20%] items-center justify-center rounded-2xl ${isOver && 'cursor-pointer'}`}
      style={{ pointerEvents: isDraggingTask ? 'auto' : 'none' }}
    >
      {dir === 'left' ? '←' : '→'}
    </motion.div>
  )
}
