import { useDroppable } from '@dnd-kit/core'
import { useAtomValue } from 'jotai'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CSSProperties } from 'react'

import { dateAtom, isDraggingTaskAtom } from '@/state/state'
import { cn } from '@/utils/cn'
import { shiftDate, shortDayLabel } from '@/utils/date'

/**
 * Drop zone on the side of the list: drop a task here to move it to the previous / next day.
 * Its animations are CSS (see `.animate-zone-breathe` in index.css), so they don't compete with the drag.
 */
export function DropMove({ id, dir }: { id: string; dir: -1 | 1 }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  const isDraggingTask = useAtomValue(isDraggingTaskAtom)
  const date = useAtomValue(dateAtom)

  const Icon = dir < 0 ? ChevronLeft : ChevronRight

  return (
    <div
      ref={setNodeRef}
      aria-hidden={!isDraggingTask}
      style={{ pointerEvents: isDraggingTask ? 'auto' : 'none' }}
      className={cn(
        'z-[1] mb-2.5 flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-zone-ink transition-[opacity,scale,background-color,border-color] ease-out sm:w-[20%]',
        // No blur behind it on phones: redone on every frame of the drag, it made the drag stutter.
        'pointer-fine:backdrop-blur-sm',
        // On phones the zones float over the edges of the list instead of taking up width.
        'max-sm:absolute max-sm:top-0 max-sm:bottom-2.5 max-sm:w-12',
        dir < 0 ? 'max-sm:left-0' : 'max-sm:right-0',
        isDraggingTask ? 'opacity-100 duration-300' : 'scale-95 opacity-0 duration-200',
        isOver ? 'scale-[1.04] border-zone-ink/50 bg-zone-over' : 'border-zone-ink/25 bg-zone/85',
        isDraggingTask && !isOver && 'animate-zone-breathe'
      )}
    >
      <div
        className={cn(isDraggingTask && 'animate-nudge-x')}
        style={{ '--nudge': dir, animationDuration: isOver ? '0.6s' : undefined } as CSSProperties}
      >
        <Icon className="size-5 sm:size-6" strokeWidth={2.75} />
      </div>
      <div className="hidden text-center leading-tight sm:block">
        <div className="text-[11px] font-bold tracking-widest uppercase opacity-70">Move to</div>
        <div className="font-display text-base font-semibold">{shortDayLabel(shiftDate(date, dir))}</div>
      </div>
    </div>
  )
}
