import { useSortable } from '@dnd-kit/sortable'
import { AnimatePresence, MotionStyle, motion, useAnimate } from 'framer-motion'
import { useAtom, useSetAtom } from 'jotai'
import { GripVertical, Pause, Pencil, Play, Repeat } from 'lucide-react'
import { ComponentProps, Ref, useCallback, useEffect, useRef, useState } from 'react'

import { RollingText } from './RollingText'
import { TimePopover } from './TimePopover'
import { VortexCheck } from './VortexCheck'
import { isEditingTaskAtom, openTimePickerAtom, taskEditAtom } from '@/state/state'
import { TaskModel } from '@/typings/types'
import { cn } from '@/utils/cn'
import { shatter } from '@/utils/shatter'
import { formatTime } from '@/utils/time'

interface Props {
  task: TaskModel
  index: number
  /** True right after a day loads, so the cards cascade in. */
  appear: boolean
  /** Its time has already passed. */
  overdue: boolean
  onComplete: (task: TaskModel, checkRect?: DOMRect) => void
  onTimeChange: (task: TaskModel, time: number) => void
  onToggleProgress: (task: TaskModel) => void
  /** Injected by AnimatePresence (popLayout). */
  ref?: Ref<HTMLDivElement>
}

export function Task({ task, index, appear, overdue, onComplete, onTimeChange, onToggleProgress, ref }: Props) {
  const setIsEditingTask = useSetAtom(isEditingTaskAtom)
  const setTaskEdit = useSetAtom(taskEditAtom)
  const [openTimePicker, setOpenTimePicker] = useAtom(openTimePickerAtom)
  const isTimePickerOpen = openTimePicker === task.uid
  const commitTimePicker = useRef<() => void>(null)

  const [isCompleted, setIsCompleted] = useState(false)
  const [isCheckHovered, setIsCheckHovered] = useState(false)
  const [isShattered, setIsShattered] = useState(false)

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

  return (
    <motion.div
      ref={setRefs}
      layout
      style={
        {
          // Each overdue card's background flow starts at a different phase, so they don't move in lockstep.
          '--overdue-offset': `${index * -2.3}s`,
        } as MotionStyle
      }
      className={cn(
        'group relative mb-2.5 flex w-full items-center gap-1.5 rounded-2xl border py-2.5 pr-2 pl-1 transition-[background-color,border-color,box-shadow] duration-200',
        isDragging ? 'shadow-lift' : 'shadow-card',
        // Hover/drag keep the card's own colour, just a shade deeper (lighter in dark mode).
        overdue
          ? cn('overdue-flow border-overdue-border bg-overdue', isDragging && 'overdue-flow-active')
          : isDragging
            ? 'border-card-hover-border bg-card-hover'
            : 'border-card-border bg-card hover:border-card-hover-border hover:bg-card-hover'
      )}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{
        opacity: isShattered ? 0 : isSaving ? 0.7 : 1,
        x: transform?.x ?? 0,
        y: transform?.y ?? 0,
        scale: isDragging ? 1.04 : 1,
        rotate: isDragging ? 1.5 : 0,
        zIndex: isDragging ? 2 : 0,
      }}
      onAnimationComplete={() => !hasEntered && setHasEntered(true)}
      exit={
        isShattered
          ? { opacity: 0, transition: { duration: 0 } } // the shards took its place
          : { opacity: 0, scale: isCompleted ? 0.85 : 0.9, transition: { duration: isCompleted ? 0.35 : 0.2 } }
      }
      transition={{
        default: { duration: isDragging ? 0 : 0.25, ease: [0.2, 0.8, 0.2, 1], delay: isDragging ? 0 : enterDelay },
        opacity: isShattered ? { duration: 0 } : { duration: 0.3, delay: enterDelay },
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
          isDragging ? 'text-ink-soft' : 'text-ink-faint/60 group-hover:text-ink-soft'
        )}
      >
        <GripVertical className="size-4" strokeWidth={2.5} />
      </button>

      <button
        ref={badgeRef}
        type="button"
        aria-label={`Time ${formatTime(task.time)}${overdue ? ', overdue' : ''}. Change time`}
        title={overdue ? 'Overdue · change time' : 'Change time'}
        aria-expanded={isTimePickerOpen}
        disabled={isSaving}
        onClick={() => (isTimePickerOpen ? commitTimePicker.current?.() : setOpenTimePicker(task.uid))}
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
        {task.recurrenceId != null && (
          <Repeat
            aria-label="Recurring task"
            className="ml-1.5 inline size-3.5 -translate-y-px text-ink-faint"
            strokeWidth={2.75}
          />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <IconButton label="Edit task" title="Edit" onClick={() => openEdition()} disabled={isSaving}>
          <Pencil className="size-[18px]" strokeWidth={2.25} />
        </IconButton>
        <IconButton
          label={task.inProgress ? 'Stop working on it' : 'Start working on it'}
          title={task.inProgress ? 'Stop working on it' : "I'm working on it"}
          aria-pressed={task.inProgress}
          onClick={() => onToggleProgress(task)}
          disabled={isSaving}
          className={task.inProgress ? 'text-primary-strong' : undefined}
        >
          {task.inProgress ? (
            <Pause className="size-[18px]" strokeWidth={2.5} fill="currentColor" />
          ) : (
            <Play className="size-[18px]" strokeWidth={2.25} />
          )}
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
          <VortexCheck active={isCheckHovered || isCompleted} inProgress={task.inProgress} />
        </button>
      </div>

      <AnimatePresence>
        {isTimePickerOpen && badgeRef.current && (
          <TimePopover
            anchor={badgeRef.current}
            initialTime={task.time}
            commitRef={commitTimePicker}
            onSave={time => onTimeChange(task, time)}
            onClose={() => setOpenTimePicker(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )

  function handleComplete() {
    const checkRect = checkRef.current?.getBoundingClientRect()
    const card = cardRef.current
    const impact = checkRect && { x: checkRect.left + checkRect.width / 2, y: checkRect.top + checkRect.height / 2 }

    // The card breaks like glass from the check; its shards replace it right away.
    if (card && shatter(card, impact)) {
      card.style.opacity = '0'
      setIsShattered(true)
    }

    setIsCompleted(true)
    onComplete(task, checkRect)
  }

  function openEdition() {
    if (isSaving) return
    setTaskEdit(task)
    setIsEditingTask(true)
  }
}

function IconButton({ label, className, children, ...props }: ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'grid size-8 cursor-pointer place-items-center rounded-full text-ink-soft sm:size-9 transition-colors hover:bg-ink/[0.07] hover:text-ink disabled:pointer-events-none disabled:opacity-30',
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
