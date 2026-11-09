import { useSortable } from '@dnd-kit/sortable'
import { MotionStyle, TargetAndTransition, motion, useAnimate } from 'framer-motion'
import { useSetAtom } from 'jotai'
import { GripVertical, Pencil } from 'lucide-react'
import { ComponentProps, Ref, useCallback, useEffect, useRef, useState } from 'react'

import { RollingText } from './RollingText'
import { VortexCheck } from './VortexCheck'
import { editFocusAtom, isEditingTaskAtom, taskEditAtom } from '@/state/state'
import { TaskModel } from '@/typings/types'
import { cn } from '@/utils/cn'
import { formatTime } from '@/utils/time'

interface Props {
  task: TaskModel
  index: number
  /** True right after a day loads, so the cards cascade in. */
  appear: boolean
  /** Its time has already passed. */
  overdue: boolean
  onComplete: (task: TaskModel, checkRect?: DOMRect) => void
  /** Injected by AnimatePresence (popLayout). */
  ref?: Ref<HTMLDivElement>
}

export function Task({ task, index, appear, overdue, onComplete, ref }: Props) {
  const setIsEditingTask = useSetAtom(isEditingTaskAtom)
  const setTaskEdit = useSetAtom(taskEditAtom)
  const setEditFocus = useSetAtom(editFocusAtom)

  const [isCompleted, setIsCompleted] = useState(false)
  const [isCheckHovered, setIsCheckHovered] = useState(false)
  const [vortexOrigin, setVortexOrigin] = useState(0.5)

  const isSaving = task.id === -1

  const { attributes, setNodeRef, listeners, transform, isDragging } = useSortable({
    id: task.uid,
    transition: null,
    disabled: isSaving,
  })

  const cardRef = useRef<HTMLDivElement | null>(null)
  const checkRef = useRef<HTMLButtonElement>(null)

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      cardRef.current = node
      setNodeRef(node)
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [setNodeRef, ref]
  )

  // When a task becomes overdue while you're looking, its time badge gives a little shake.
  const [badgeRef, animateBadge] = useAnimate<HTMLButtonElement>()
  const wasOverdue = useRef(overdue)
  useEffect(() => {
    if (overdue && !wasOverdue.current && badgeRef.current) {
      animateBadge(badgeRef.current, { rotate: [0, -14, 12, -8, 5, 0], scale: [1, 1.25, 1] }, { duration: 0.7 })
    }
    wasOverdue.current = overdue
  }, [overdue, animateBadge, badgeRef])

  // Cascade delay only applies to the very first entrance of the card.
  const [mountDelay] = useState(() => (appear ? Math.min(index, 8) * 0.045 : 0))
  const [hasEntered, setHasEntered] = useState(false)
  const enterDelay = hasEntered ? 0 : mountDelay

  // Sucked into the vortex: shrink towards the check button fast, spinning faster and faster.
  const vortexExit: TargetAndTransition = {
    opacity: 0,
    scale: 0,
    rotate: -1440,
    transition: {
      scale: { duration: 1, ease: [0.33, 1, 0.68, 1] },
      rotate: { duration: 1, ease: [0.5, 0, 0.75, 0] },
      opacity: { duration: 1, ease: [0.7, 0, 0.84, 0] },
    },
  }

  return (
    <motion.div
      ref={setRefs}
      layout
      style={
        {
          originX: isCompleted ? vortexOrigin : 0.5,
          // Each overdue card's background flow starts at a different phase, so they don't move in lockstep.
          '--overdue-offset': `${index * -2.3}s`,
        } as MotionStyle
      }
      className={cn(
        'group relative mb-2.5 flex w-full items-center gap-1.5 rounded-2xl border py-2.5 pr-2 pl-1 transition-[background-color,border-color,box-shadow] duration-200',
        isDragging
          ? 'border-card-hover-border bg-card-hover shadow-lift'
          : overdue
            ? 'overdue-flow border-overdue-border bg-overdue shadow-card hover:border-card-hover-border hover:bg-card-hover'
            : 'border-card-border bg-card shadow-card hover:border-card-hover-border hover:bg-card-hover'
      )}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{
        opacity: isSaving ? 0.7 : 1,
        x: transform?.x ?? 0,
        y: transform?.y ?? 0,
        scale: isDragging ? 1.04 : 1,
        rotate: isDragging ? 1.5 : 0,
        zIndex: isDragging ? 2 : 0,
      }}
      onAnimationComplete={() => !hasEntered && setHasEntered(true)}
      exit={isCompleted ? vortexExit : { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{
        default: { duration: isDragging ? 0 : 0.25, ease: [0.2, 0.8, 0.2, 1], delay: isDragging ? 0 : enterDelay },
        opacity: { duration: 0.3, delay: enterDelay },
        scale: { type: 'spring', stiffness: 420, damping: 26, delay: isDragging ? 0 : enterDelay },
        rotate: { type: 'spring', stiffness: 420, damping: 22 },
        zIndex: { delay: isDragging ? 0 : 0.25 },
        layout: { type: 'spring', stiffness: 520, damping: 42 },
      }}
    >
      {isSaving && <SavingShimmer />}

      <button
        type="button"
        aria-label="Drag to reorder, or to the sides to move to another day"
        title="Drag to reorder · drop on the sides to change day"
        disabled={isSaving}
        {...attributes}
        {...listeners}
        className={cn(
          '-my-1 flex w-6 shrink-0 cursor-grab touch-none items-center justify-center self-stretch rounded-xl transition-colors active:cursor-grabbing disabled:pointer-events-none',
          isDragging ? 'text-amber-600 dark:text-amber-300' : 'text-ink-faint/60 group-hover:text-ink-soft'
        )}
      >
        <GripVertical className="size-4" strokeWidth={2.5} />
      </button>

      <button
        ref={badgeRef}
        type="button"
        aria-label={`Time ${formatTime(task.time)}${overdue ? ', overdue' : ''}. Change time`}
        title={overdue ? 'Overdue · change time' : 'Change time'}
        disabled={isSaving}
        onClick={() => openEdition('time')}
        className={cn(
          'shrink-0 cursor-pointer rounded-lg px-1.5 py-0.5 font-display text-sm font-semibold transition-colors disabled:pointer-events-none',
          overdue
            ? 'bg-overdue-badge text-overdue-badge-ink shadow-sm shadow-rose-600/40 hover:brightness-110'
            : 'bg-white/50 text-ink-soft hover:bg-white hover:text-ink dark:bg-white/[0.06] dark:hover:bg-white/15'
        )}
      >
        <RollingText text={formatTime(task.time)} separatorClassName="opacity-60" />
      </button>

      <div
        className="min-w-0 flex-1 py-1 pl-0.5 text-[15px] leading-snug font-semibold break-words"
        onDoubleClick={() => openEdition()}
      >
        {task.title}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <IconButton label="Edit task" title="Edit" onClick={() => openEdition()} disabled={isSaving}>
          <Pencil className="size-[18px]" strokeWidth={2.25} />
        </IconButton>
        <button
          ref={checkRef}
          type="button"
          aria-label="Complete task"
          title="Done!"
          disabled={isSaving || isCompleted}
          onClick={handleComplete}
          onPointerEnter={e => e.pointerType !== 'touch' && setIsCheckHovered(true)}
          onPointerLeave={() => setIsCheckHovered(false)}
          onFocus={e => e.currentTarget.matches(':focus-visible') && setIsCheckHovered(true)}
          onBlur={() => setIsCheckHovered(false)}
          className="grid size-9 cursor-pointer place-items-center rounded-full transition-transform active:scale-90 disabled:cursor-default"
        >
          <VortexCheck active={isCheckHovered || isCompleted} />
        </button>
      </div>
    </motion.div>
  )

  function handleComplete() {
    const checkRect = checkRef.current?.getBoundingClientRect()
    const cardRect = cardRef.current?.getBoundingClientRect()

    if (checkRect && cardRect) {
      setVortexOrigin((checkRect.left + checkRect.width / 2 - cardRect.left) / cardRect.width)
    }

    setIsCompleted(true)
    onComplete(task, checkRect)
  }

  function openEdition(focus: 'title' | 'time' = 'title') {
    if (isSaving) return
    setTaskEdit(task)
    setEditFocus(focus)
    setIsEditingTask(true)
  }
}

function IconButton({ label, className, children, ...props }: ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'grid size-8 cursor-pointer place-items-center rounded-full text-ink-soft sm:size-9 transition-colors hover:bg-amber-500/10 hover:text-amber-700 disabled:pointer-events-none disabled:opacity-30 dark:hover:text-amber-300',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function SavingShimmer() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-transparent dark:via-white/10" />
    </div>
  )
}
