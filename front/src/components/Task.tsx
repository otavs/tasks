import { useSortable } from '@dnd-kit/sortable'
import { AnimatePresence, MotionStyle, motion, useAnimate } from 'framer-motion'
import { useAtom, useSetAtom } from 'jotai'
import { GripVertical, Pause, Pencil, Play } from 'lucide-react'
import { ComponentProps, Ref, memo, useCallback, useEffect, useRef, useState } from 'react'

import { RollingText } from './RollingText'
import { TimePopover } from './TimePopover'
import { TypeTile } from './TypeTile'
import { VortexCheck } from './VortexCheck'
import { isEditingTaskAtom, openTimePickerAtom, taskEditAtom } from '@/state/state'
import { TaskModel } from '@/typings/types'
import { cn } from '@/utils/cn'
import { shatter } from '@/utils/shatter'
import { DEFAULT_TASK_TYPE, taskType } from '@/utils/taskTypes'
import { formatTime } from '@/utils/time'

interface Props {
  task: TaskModel
  index: number
  /** True right after a day loads, so the cards cascade in. */
  appear: boolean
  /** Its time has already passed. */
  overdue: boolean
  /**
   * Changes whenever the list's layout may have changed (the day's tasks were updated). The card only
   * measures itself for layout animations then: while dragging, every card re-renders on every move.
   */
  layoutKey: unknown
  onComplete: (task: TaskModel, checkRect?: DOMRect) => void
  onTimeChange: (task: TaskModel, time: number) => void
  onToggleProgress: (task: TaskModel) => void
  /** Injected by AnimatePresence (popLayout). */
  ref?: Ref<HTMLDivElement>
}

export function Task({
  task,
  index,
  appear,
  overdue,
  layoutKey,
  onComplete,
  onTimeChange,
  onToggleProgress,
  ref,
}: Props) {
  const setIsEditingTask = useSetAtom(isEditingTaskAtom)
  const setTaskEdit = useSetAtom(taskEditAtom)
  const [openTimePicker, setOpenTimePicker] = useAtom(openTimePickerAtom)
  const isTimePickerOpen = openTimePicker === task.uid
  const commitTimePicker = useRef<() => void>(null)

  const [isCompleted, setIsCompleted] = useState(false)
  const [isCheckHovered, setIsCheckHovered] = useState(false)
  const [isShattered, setIsShattered] = useState(false)

  const isSaving = task.id === -1
  // Normalized, so an unknown type (say, from a newer server) still gets a proper look.
  const type = taskType(task.type).id

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

  // A typed overdue card is ringed in rose (unless you're on it: then the comet has the border).
  const isRinged = overdue && !task.inProgress && type !== DEFAULT_TASK_TYPE
  // A plain task turns rose when overdue, with a flowing background.
  const isFlowing = overdue && type === DEFAULT_TASK_TYPE
  const hasComet = task.inProgress && !isSaving
  // All the rings breathe in step, and all the comets circle in step. CSS starts each animation when
  // its card appears, and starts it over when the card is moved in the page (a reorder moves its
  // element), so they're pinned to the same clock whenever that may have happened.
  useEffect(() => {
    if (isRinged) syncAnimations('overdue-breathe')
    if (hasComet) syncAnimations('progress-comet')
  }, [isRinged, hasComet, index])

  // Cascade delay only applies to the very first entrance of the card.
  const [mountDelay] = useState(() => (appear ? Math.min(index, 8) * 0.045 : 0))
  const [hasEntered, setHasEntered] = useState(false)
  const enterDelay = hasEntered ? 0 : mountDelay

  return (
    <motion.div
      ref={setRefs}
      layout
      layoutDependency={layoutKey}
      style={
        {
          // Each overdue card's background flow starts at a different phase, so they don't move in lockstep.
          '--overdue-offset': `${index * -2.3}s`,
          // Its own layer while dragged: following the finger then only moves it, without repainting it.
          willChange: isDragging ? 'transform' : undefined,
        } as MotionStyle
      }
      data-type={type}
      className={cn(
        'type-card group relative mb-2.5 flex w-full items-center gap-1.5 rounded-2xl border py-2.5 pr-2 pl-1 transition-[background-color,border-color,box-shadow] duration-200',
        isDragging ? 'shadow-lift' : 'shadow-card',
        // A plain task turns rose when overdue; a typed one keeps its colours (see isRinged).
        isFlowing
          ? cn('overdue-flow border-overdue-border bg-overdue', isDragging && 'overdue-flow-active')
          : cn(
              // Hover/drag keep the card's own colour, just a shade deeper (lighter in dark mode).
              isDragging
                ? 'border-type-border-hover bg-type-hover'
                : 'border-type-border bg-type hover:border-type-border-hover hover:bg-type-hover',
              isRinged && 'overdue-ring'
            )
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
      {isFlowing && <OverdueFlow />}
      {isSaving && <SavingShimmer />}
      {hasComet && <ProgressComet />}

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

      <TypeTile type={type} className="size-7 rounded-[9px] sm:size-8 sm:rounded-[10px]" iconClassName="size-4" />

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
        className="task-title min-w-0 flex-1 py-1 pl-0.5 text-[15px] leading-snug font-semibold break-words"
        onDoubleClick={() => openEdition()}
      >
        {task.title}
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
        >
          {task.inProgress ? (
            <Pause className="size-[18px]" strokeWidth={2.25} />
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

    setIsCompleted(true)

    // The card breaks like glass from the check; its shards replace it right away. The rest (list
    // update, confetti) waits for the shards' first frame, so their flight starts without a hitch.
    if (card && shatter(card, impact)) {
      card.style.opacity = '0'
      setIsShattered(true)
      requestAnimationFrame(() => setTimeout(() => onComplete(task, checkRect)))
    } else {
      onComplete(task, checkRect)
    }
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

/** The overdue card's flowing background: two bands sliding inside a clip (see .overdue-flow in index.css). */
const OverdueFlow = memo(function OverdueFlow() {
  return (
    <span aria-hidden data-shatter-whole className="overdue-flow-layer">
      <span className="overdue-flow-band overdue-flow-base" />
      <span className="overdue-flow-band overdue-flow-sheen" />
    </span>
  )
})

function SavingShimmer() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-transparent dark:via-white/10" />
    </div>
  )
}

/** Seconds for the comet to go once around the card. */
const COMET_LAP = 3

/**
 * A smooth fade along the comet: many very faint dashes (lengths in % of the way around), all ending
 * at the same front, so the strength builds up step by step, each step too small to see.
 */
const fade = (reach: number, steps: number) => Array.from({ length: steps }, (_, i) => reach * (1 - i / steps))

/** The long trail, then the head: the same kind of fade, shorter, stronger and (in the dark) glowing. */
const COMET_TRAIL = fade(36, 28)
const COMET_HEAD = fade(7, 10)

/**
 * "I'm working on it": a comet of light circling the card just outside its border, at an even speed
 * whatever the card's shape (the outline is measured as 100 units, `pathLength`). Each dash's
 * animation is shifted by its length, so all their fronts move together as one point.
 */
const ProgressComet = memo(function ProgressComet() {
  return (
    <svg aria-hidden data-shatter-skip className="progress-comet">
      <rect className="progress-comet-track" width="100%" height="100%" rx="17" pathLength={100} />
      <g className="progress-comet-trail">{COMET_TRAIL.map(cometDash)}</g>
      <g className="progress-comet-head">{COMET_HEAD.map(cometDash)}</g>
    </svg>
  )
})

function cometDash(length: number, i: number) {
  return (
    <rect
      key={i}
      className="progress-comet-dash"
      width="100%"
      height="100%"
      rx="17"
      pathLength={100}
      strokeDasharray={`${length} ${100 - length}`}
      style={{ animationDuration: `${COMET_LAP}s`, animationDelay: `${(length / 100 - 1) * COMET_LAP}s` }}
    />
  )
}

/** Puts every running CSS animation with this name on the same clock, so they all move in step. */
function syncAnimations(name: string) {
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSAnimation && animation.animationName === name) animation.startTime = 0
  }
}
