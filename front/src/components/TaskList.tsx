import { useGetTasks, useReorderTask } from '../api/tasks.ts'
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

export function TaskList() {
  const queryClient = useQueryClient()
  const [date] = useAtom(dateAtom)
  const { data: tasks, isPending, isError, error } = useGetTasks()
  const reorderTask = useReorderTask()

  const tasksSorted = tasks?.sort((a: TaskModel, b: TaskModel) => a.position! - b.position!) ?? []

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
        <SortableContext items={tasksSorted.map((task: TaskModel) => task.id)} strategy={verticalListSortingStrategy}>
          {tasksSorted.map((task: TaskModel) => (
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

    const oldIndex = tasksSorted.findIndex((task: TaskModel) => task.id === active.id)
    const newIndex = tasksSorted.findIndex((task: TaskModel) => task.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const updatedTasks = [...tasksSorted]
    const [movedTask] = updatedTasks.splice(oldIndex, 1)
    updatedTasks.splice(newIndex, 0, movedTask)

    updatedTasks.forEach((task: TaskModel, index: number) => {
      task.position = index
    })

    queryClient.setQueryData(['tasks', date.day, date.month, date.year], updatedTasks)

    reorderTask.mutate(
      { id: movedTask.id, newPosition: newIndex },
      {
        onSuccess: () => {
          console.log('Reordered task')
        },
        onError: () => {
          queryClient.setQueryData(['tasks', date.day, date.month, date.year], tasksSorted)
        },
      }
    )
  }
}
