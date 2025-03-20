import { useState } from 'react'
import { useDeleteTask } from '../api/tasks.ts'
import { TaskModel } from '../types.tsx'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Props {
  task: TaskModel
}

export function Task({ task }: Props) {
  const deleteTask = useDeleteTask()
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null)
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id! })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`${deletingTaskId === task.id ? 'delete-animation' : ''} m-2 flex w-1/2 justify-between rounded border p-2 hover:bg-amber-100`}
      >
        <div>{task.title}</div>
        <div>
          <button
            className="min-w-5 cursor-pointer bg-amber-200"
            onClick={() => openEdition(task.id!)}
            disabled={deleteTask.isPending}
          >
            E
          </button>
          <button
            className="min-w-5 cursor-move bg-amber-200"
            onClick={() => handleDelete(task.id!)}
            disabled={deleteTask.isPending}
            {...attributes}
            {...listeners}
          >
            M
          </button>
          <button
            className="min-w-5 cursor-pointer bg-amber-200"
            onClick={() => handleDelete(task.id!)}
            disabled={deleteTask.isPending}
          >
            D
          </button>
        </div>
      </div>
    </>
  )

  function handleDelete(id: number) {
    setDeletingTaskId(id)

    setTimeout(async () => {
      deleteTask.mutate(id)
    }, 500)
  }

  function openEdition(id: number) {
    // set editing task id
    // open modal
  }
}
