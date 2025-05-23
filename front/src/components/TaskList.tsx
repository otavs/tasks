import {
  ClientRect,
  CollisionDetection,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Coordinates } from '@dnd-kit/core/dist/types'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AnimatePresence } from 'framer-motion'
import { useAtom, useSetAtom } from 'jotai'

import { DropMove } from './DropMove'
import { Task } from './Task'
import { useDeleteTaskMutation } from '@/api/tasks/delete'
import { useListTasksQuery } from '@/api/tasks/list'
import { useMoveTaskMutation } from '@/api/tasks/move'
import { useReorderTaskMutation } from '@/api/tasks/reorder'
import { dateAtom, draggingTaskIdAtom, isDraggingTaskAtom } from '@/state/state'
import { TaskModel } from '@/typings/types'
import { restrictToParentElementY } from '@/utils/restrictToParentElementY'

export function TaskList() {
  const [date] = useAtom(dateAtom)
  const setIsDraggingTask = useSetAtom(isDraggingTaskAtom)
  const setDraggingTaskId = useSetAtom(draggingTaskIdAtom)

  const { data: tasks, isPending, isError, error } = useListTasksQuery()

  const reorderTask = useReorderTaskMutation()
  const deleteTask = useDeleteTaskMutation()
  const moveTask = useMoveTaskMutation()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor)
  )

  if (isError) {
    return <span>Error: {error.message}</span>
  }

  if (isPending) {
    return
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      modifiers={[restrictToParentElementY]}
    >
      <div className="flex justify-evenly">
        <DropMove id="moveToPrevious" dir="left" hide={tasks.length === 0} />
        <div className="flex w-[80%] flex-col items-center justify-center sm:w-[400px]">
          <SortableContext
            items={tasks.map((task: TaskModel) => task.uid)}
            strategy={verticalListSortingStrategy}
            key={`${date.day}-${date.month}-${date.year}`}
          >
            <AnimatePresence>
              {tasks.map((task: TaskModel) => (
                <Task key={task.uid} task={task} onDelete={handleDeleteTask} />
              ))}
            </AnimatePresence>
          </SortableContext>
        </div>
        <DropMove id="moveToNext" dir="right" hide={tasks.length === 0} />
      </div>
    </DndContext>
  )

  function handleDragStart(event: DragEndEvent) {
    const { active } = event
    setIsDraggingTask(true)
    setDraggingTaskId(Number(active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setIsDraggingTask(false)
    setDraggingTaskId(null)

    const { active, over } = event

    if (!over || active.id === over.id || !tasks) {
      return
    }

    const movedTask = tasks!.find(task => task.uid === Number(active.id))
    if (!movedTask) return

    if (over.id === 'moveToPrevious') {
      return handleMoveTask(movedTask.id, -1)
    }
    if (over.id === 'moveToNext') {
      return handleMoveTask(movedTask.id, 1)
    }

    const oldIndex = tasks.findIndex(task => task.uid === active.id)
    const newIndex = tasks.findIndex(task => task.uid === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    reorderTask.mutate({ id: movedTask!.id, newPosition: newIndex })
  }

  function handleDeleteTask(taskId: number) {
    deleteTask.mutate(taskId)
  }

  function handleMoveTask(taskId: number, dayIncrement: number) {
    const newDate = new Date(date.year, date.month - 1, date.day)
    newDate.setDate(newDate.getDate() + dayIncrement)

    moveTask.mutate({
      id: taskId,
      date: {
        day: newDate.getDate(),
        month: newDate.getMonth() + 1,
        year: newDate.getFullYear(),
      },
    })
  }
}

const customCollisionDetection: CollisionDetection = args => {
  if (isInside('moveToPrevious') || isInside('moveToNext')) {
    return pointerWithin(args)
  }

  return closestCenter(args)

  function isInside(id: string) {
    if (!args.pointerCoordinates) return false
    const rect = args.droppableRects.get(id)
    if (!rect) return false
    return isPointerInside(args.pointerCoordinates, rect)
  }

  function isPointerInside({ x, y }: Coordinates, { top, left, right, bottom }: ClientRect) {
    return x >= left && x <= right && y >= top && y <= bottom
  }
}
