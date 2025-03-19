import { useState } from 'react'
import { useDeleteTask } from '../api/tasks.ts'
import { TaskModel } from '../types.tsx'

interface Props {
  task: TaskModel
}

export function Task({ task }: Props) {
  const deleteTask = useDeleteTask()
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null)

  return (
    <>
      <div
        className={`${deletingTaskId === task.id ? 'delete-animation' : ''} m-2 flex w-1/2 justify-between rounded border p-2 hover:bg-amber-100`}
      >
        <div>{task.title}</div>
        <div>
          <button
            className="min-w-5 cursor-pointer bg-amber-200"
            onClick={() => handleDelete(task.id!)}
            disabled={deleteTask.isPending}
          >
            {deleteTask.isPending ? 'Deleting...' : 'D'}
          </button>
          <div></div>
        </div>
      </div>
    </>
  )

  function handleDelete(id: number) {
    setDeletingTaskId(id)

    setTimeout(async() => {
      deleteTask.mutate(id)
    }, 500)
  }
}
