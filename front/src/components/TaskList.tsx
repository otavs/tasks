import { useGetTasksQuery, useReorderTaskMutation } from '../api/tasks.ts'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskModel } from '../types.tsx'
import { Task } from './Task.tsx'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { dateAtom } from '../state.ts'
import { useEffect, useState } from 'react'

export function TaskList() {
  const [date] = useAtom(dateAtom)
  const queryClient = useQueryClient()

  const { data: tasks, isPending, isError, error } = useGetTasksQuery()
  const tasksSorted = tasks?.sort((a: TaskModel, b: TaskModel) => a.position! - b.position!) ?? []
  const [optimisticTasks, setOptimisticTasks] = useState<TaskModel[]>([])

  const reorderTask = useReorderTaskMutation()

  useEffect(() => {
    setOptimisticTasks(tasksSorted)
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  if (isPending) {
    return
  }

  if (isError) {
    return <span>Error: {error.message}</span>
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext
          items={optimisticTasks.map((task: TaskModel) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {optimisticTasks.map((task: TaskModel) => (
            <Task key={task.id} task={task} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = optimisticTasks.findIndex(task => task.id === active.id)
    const newIndex = optimisticTasks.findIndex(task => task.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const updatedTasks = [...optimisticTasks]
    const [movedTask] = updatedTasks.splice(oldIndex, 1)
    updatedTasks.splice(newIndex, 0, movedTask)

    updatedTasks.forEach((task, index) => {
      task.position = index
    })

    setOptimisticTasks(updatedTasks)

    queryClient.setQueryData(['tasks', date.day, date.month, date.year], updatedTasks)

    reorderTask.mutate(
      { id: movedTask.id, newPosition: newIndex },
      {
        onSuccess: () => console.log('Reordered task'),
        onError: () => {
          setOptimisticTasks(tasksSorted)
          queryClient.setQueryData(['tasks', date.day, date.month, date.year], tasksSorted)
        },
      }
    )
  }
}
