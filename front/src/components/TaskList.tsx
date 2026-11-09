import {
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useAtomValue, useSetAtom } from 'jotai'
import { RotateCw } from 'lucide-react'
import { RefObject, useEffect, useMemo, useRef, useState } from 'react'

import { DropMove } from './DropMove'
import { EmptyState } from './EmptyState'
import { Task } from './Task'
import { useCreateTaskMutation } from '@/api/tasks/create'
import { useDeleteTaskMutation } from '@/api/tasks/delete'
import { tasksQueryOptions, useListTasksQuery } from '@/api/tasks/list'
import { useMoveTaskMutation } from '@/api/tasks/move'
import { useReorderTaskMutation } from '@/api/tasks/reorder'
import { useUpdateTaskMutation } from '@/api/tasks/update'
import { dateAtom, dayDirectionAtom, isDraggingTaskAtom, nowMinutesAtom, todayAtom } from '@/state/state'
import { toast } from '@/state/toast'
import { TaskModel } from '@/typings/types'
import { celebrate, celebrateBig } from '@/utils/confetti'
import { dateKey, dayDiff, relativeDayLabel, shiftDate, shortDayLabel } from '@/utils/date'
import { restrictToParentElementY } from '@/utils/restrictToParentElementY'
import { formatTime, inferTime } from '@/utils/time'

export function TaskList() {
  const date = useAtomValue(dateAtom)
  const today = useAtomValue(todayAtom)
  const nowMinutes = useAtomValue(nowMinutesAtom)
  const direction = useAtomValue(dayDirectionAtom)
  const setIsDraggingTask = useSetAtom(isDraggingTaskAtom)
  const queryClient = useQueryClient()

  const { data: tasks, isPending, isError, refetch, isRefetching } = useListTasksQuery()

  const reorderTask = useReorderTaskMutation()
  const deleteTask = useDeleteTaskMutation()
  const moveTask = useMoveTaskMutation()
  const createTask = useCreateTaskMutation()
  const updateTask = useUpdateTaskMutation()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    useSensor(TouchSensor)
  )

  const dragStartXRef = useRef<number | null>(null)
  const collisionDetection = useMemo(() => dayZoneCollisionDetection(dragStartXRef), [])

  // Prefetch the neighbouring days so flipping through them feels instant.
  useEffect(() => {
    for (const offset of [-1, 1]) {
      queryClient.prefetchQuery(tasksQueryOptions(shiftDate(date, offset), queryClient))
    }
  }, [date, queryClient])

  const key = dateKey(date)

  // Cards cascade in only when a day's list first shows up, not on every later render.
  const appearRef = useRef<{ key: string; at: number } | null>(null)
  if (tasks && appearRef.current?.key !== key) appearRef.current = { key, at: performance.now() }
  const appear = !!appearRef.current && performance.now() - appearRef.current.at < 400

  if (isError) {
    return (
      <div className="mx-auto flex max-w-[440px] flex-col items-center gap-3 rounded-2xl border border-card-border bg-card/60 px-6 py-8 text-center">
        <p className="font-display text-xl font-semibold">Couldn't load your tasks</p>
        <p className="text-sm font-medium text-ink-soft">The server seems to be napping.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex cursor-pointer items-center gap-2 rounded-full border-2 border-transparent bg-primary px-4 py-1.5 font-bold text-primary-ink hover:border-primary-ring"
        >
          <RotateCw className={isRefetching ? 'size-4 animate-spin' : 'size-4'} strokeWidth={2.5} />
          Try again
        </button>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[restrictToParentElementY]}
    >
      <div className="relative flex justify-evenly gap-2">
        <DropMove id="moveToPrevious" dir={-1} />

        <motion.div
          key={key}
          initial={{ opacity: 0, x: direction * 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="relative flex min-w-0 flex-1 flex-col items-center sm:w-[440px] sm:flex-none"
        >
          {isPending ? (
            <LoadingSkeleton />
          ) : (
            <SortableContext items={tasks.map(task => task.uid)} strategy={verticalListSortingStrategy}>
              <AnimatePresence mode="popLayout">
                {tasks.map((task, index) => (
                  <Task
                    key={task.uid}
                    task={task}
                    index={index}
                    appear={appear}
                    overdue={isOverdue(task)}
                    onComplete={handleComplete}
                    onTimeChange={(task, time) => updateTask.mutate({ id: task.id, time })}
                    onToggleProgress={task => updateTask.mutate({ id: task.id, inProgress: !task.inProgress })}
                  />
                ))}
              </AnimatePresence>
            </SortableContext>
          )}

          <AnimatePresence>{!isPending && tasks.length === 0 && <EmptyState key="empty" />}</AnimatePresence>
        </motion.div>

        <DropMove id="moveToNext" dir={1} />
      </div>
    </DndContext>
  )

  /** Past days are all overdue; today, a task is overdue once its minute has gone by. */
  function isOverdue(task: TaskModel) {
    const daysFromToday = dayDiff(today, date)
    return daysFromToday < 0 || (daysFromToday === 0 && task.time < nowMinutes)
  }

  function handleDragStart({ activatorEvent }: DragStartEvent) {
    dragStartXRef.current = clientX(activatorEvent)
    setIsDraggingTask(true)
  }

  function handleDragCancel() {
    dragStartXRef.current = null
    setIsDraggingTask(false)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    handleDragCancel()

    if (!over || active.id === over.id || !tasks) return

    const movedTask = tasks.find(task => task.uid === active.id)
    if (!movedTask) return

    if (over.id === 'moveToPrevious') return handleMoveTask(movedTask, -1)
    if (over.id === 'moveToNext') return handleMoveTask(movedTask, 1)

    const oldIndex = tasks.indexOf(movedTask)
    const newIndex = tasks.findIndex(task => task.uid === over.id)
    if (newIndex === -1) return

    // The list is always ordered by time: if the new spot breaks that, give the task a time that fits.
    const reordered = arrayMove(tasks, oldIndex, newIndex)
    const time = inferTime(movedTask.time, reordered[newIndex - 1]?.time, reordered[newIndex + 1]?.time)

    reorderTask.mutate({ id: movedTask.id, newPosition: newIndex, time })

    if (time !== movedTask.time) toast(`Rescheduled to ${formatTime(time)} 🕑`)
  }

  function handleComplete(task: TaskModel, checkRect?: DOMRect) {
    if (!tasks) return

    const index = tasks.findIndex(t => t.uid === task.uid)
    const isLastOne = tasks.length === 1
    const taskDate = date

    celebrate(checkRect)
    navigator.vibrate?.(15)
    if (isLastOne) setTimeout(celebrateBig, 450)

    deleteTask.mutate(task.id)

    toast(isLastOne ? 'All done! 🎉' : 'Nice, task done!', {
      tone: 'success',
      duration: 5000,
      action: {
        label: 'Undo',
        run: () =>
          createTask.mutate({
            title: task.title,
            date: taskDate,
            time: task.time,
            inProgress: task.inProgress,
            position: index,
          }),
      },
    })
  }

  function handleMoveTask(task: TaskModel, dayIncrement: -1 | 1) {
    const target = shiftDate(date, dayIncrement)
    moveTask.mutate({ id: task.id, date: target })

    const label = Math.abs(dayDiff(today, target)) <= 1 ? relativeDayLabel(target, today) : shortDayLabel(target)
    toast(`Moved to ${label} ${dayIncrement > 0 ? '→' : '←'}`)
  }
}

function LoadingSkeleton() {
  // Only show the skeleton if loading takes a moment, to avoid a flash.
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 250)
    return () => clearTimeout(timeout)
  }, [])

  if (!visible) return null

  return (
    <div aria-label="Loading tasks" className="flex w-full flex-col">
      {[0.9, 0.65, 0.8].map((width, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
          className="mb-2.5 flex h-[58px] items-center rounded-2xl border border-card-border bg-card px-4"
        >
          <div className="h-3 rounded-full bg-ink/10" style={{ width: `${width * 70}%` }} />
        </motion.div>
      ))}
    </div>
  )
}

const DAY_ZONES = ['moveToPrevious', 'moveToNext']
const DAY_ZONE_THRESHOLD = 24

/**
 * Reordering targets the closest card. A day zone only wins after a clear horizontal drag towards it,
 * and its hit area extends to the edge of the screen. On phones the zones overlay the list edges, right
 * where the grip handle is, so a plain vertical drag must never count as "move to another day".
 */
function dayZoneCollisionDetection(dragStartX: RefObject<number | null>): CollisionDetection {
  return args => {
    const pointer = args.pointerCoordinates
    const startX = dragStartX.current

    if (pointer && startX !== null) {
      const dx = pointer.x - startX
      const previous = args.droppableRects.get('moveToPrevious')
      const next = args.droppableRects.get('moveToNext')

      if (previous && dx < -DAY_ZONE_THRESHOLD && pointer.x <= previous.right) return [{ id: 'moveToPrevious' }]
      if (next && dx > DAY_ZONE_THRESHOLD && pointer.x >= next.left) return [{ id: 'moveToNext' }]
    }

    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter(container => !DAY_ZONES.includes(String(container.id))),
    })
  }
}

function clientX(event: Event | null) {
  if (event instanceof MouseEvent) return event.clientX // includes PointerEvent
  if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) return event.touches[0]?.clientX ?? null
  return null // keyboard dragging never reaches the day zones
}
