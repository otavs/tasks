import { useDeleteTaskMutation, useGetTasksQuery, useMoveTaskMutation, useReorderTaskMutation } from '../api/tasks.ts'
import {
  ClientRect,
  closestCenter,
  CollisionDetection,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskModel } from '../types.tsx'
import { Task } from './Task.tsx'
import { useQueryClient } from '@tanstack/react-query'
import { useAtom, useSetAtom } from 'jotai'
import { dateAtom, isDraggingTaskAtom } from '../state.ts'
import { useEffect, useState } from 'react'
import { Coordinates } from '@dnd-kit/core/dist/types/coordinates'
import { DropMove } from './DropMove.tsx'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { restrictToParentElementY } from '../utils/restrictToParentElementY.ts'

export function TaskList() {
  const [date] = useAtom(dateAtom)
  const setIsDraggingTask = useSetAtom(isDraggingTaskAtom)
  const queryClient = useQueryClient()

  const { data: tasksRes, isPending, isError, error } = useGetTasksQuery()
  const [tasks, setTasks] = useState<TaskModel[]>([])
  const tasksSorted = tasks?.sort((a: TaskModel, b: TaskModel) => a.position! - b.position!) ?? []

  const reorderTask = useReorderTaskMutation()
  const deleteTask = useDeleteTaskMutation()
  const moveTask = useMoveTaskMutation()

  useEffect(() => {
    console.log(deleteTask.isPending)
    if (!deleteTask.isPending) setTasks(tasksRes)
  }, [tasksRes])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor)
  )

  if (isPending) {
    return
  }

  if (isError) {
    return <span>Error: {error.message}</span>
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      modifiers={[restrictToParentElementY]}
    >
      <div className="flex justify-evenly">
        <DropMove id="moveToPrevious" dir="left" />
        <div className="flex flex-col items-center justify-center w-[80%] sm:w-[400px]">
          <SortableContext items={tasksSorted.map((task: TaskModel) => task.id)} strategy={verticalListSortingStrategy}>
            {tasksSorted.map((task: TaskModel) => (
              <Task key={task.id} task={task} onDelete={handleDeleteTask} />
            ))}
          </SortableContext>
        </div>
        <DropMove id="moveToNext" dir="right" />
      </div>
    </DndContext>
  )

  function handleDragStart() {
    setIsDraggingTask(true)
  }

  function handleDragEnd(event: DragEndEvent) {
    setIsDraggingTask(false)

    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    if (over.id === 'moveToPrevious') {
      return handleMoveTask(Number(active.id), -1)
    }

    if (over.id === 'moveToNext') {
      return handleMoveTask(Number(active.id), 1)
    }

    const oldIndex = tasksSorted.findIndex(task => task.id === active.id)
    const newIndex = tasksSorted.findIndex(task => task.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const updatedTasks = [...tasksSorted]
    const [movedTask] = updatedTasks.splice(oldIndex, 1)
    updatedTasks.splice(newIndex, 0, movedTask)

    updatedTasks.forEach((task, index) => {
      task.position = index
    })

    setTasks(updatedTasks)

    reorderTask.mutate(
      { id: movedTask.id, newPosition: newIndex },
      {
        onError: () => {
          setTasks(tasksRes)
          queryClient.setQueryData(['tasks', date.day, date.month, date.year], tasksRes)
        },
      }
    )
  }

  function handleDeleteTask(taskId: number) {
    const updatedTasks = tasks.filter(task => task.id !== taskId)

    setTasks(updatedTasks)

    deleteTask.mutate(taskId, {
      onError: () => {
        setTasks(tasksRes)
        queryClient.setQueryData(['tasks', date.day, date.month, date.year], tasksRes)
      },
    })
  }

  function handleMoveTask(taskId: number, dayIncrement: number) {
    const updatedTasks = tasks.filter(task => task.id !== taskId)

    setTasks(updatedTasks)

    const newDate = new Date(date.year, date.month - 1, date.day)
    newDate.setDate(newDate.getDate() + dayIncrement)

    moveTask.mutate(
      {
        id: taskId,
        date: {
          day: newDate.getDate(),
          month: newDate.getMonth() + 1,
          year: newDate.getFullYear(),
        },
      },
      {
        onError: () => {
          setTasks(tasksRes)
          queryClient.setQueryData(['tasks', date.day, date.month, date.year], tasksRes)
        },
      }
    )
  }
}
