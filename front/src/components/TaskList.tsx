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

export function TaskList() {
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
    return <span>Loading...</span>
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
        <SortableContext items={tasksSorted} strategy={verticalListSortingStrategy}>
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

    const activeTask = tasks.find((task: TaskModel) => task.id === active.id)
    const overTask = tasks.find((task: TaskModel) => task.id === over.id)

    reorderTask.mutate(
      { id: activeTask.id, newPosition: overTask.position },
      {
        onSuccess: () => {
          console.log('Reordered task')
        },
      }
    )
  }
}
