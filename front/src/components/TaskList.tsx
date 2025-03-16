import { Task } from './Task.tsx'
import { TaskModel } from '../types.tsx'
import { useGetTasks } from '../api/tasks.ts'

export function TaskList() {
  const { data, isPending, isError, error } = useGetTasks()

  if (isPending) {
    return <span>Loading...</span>
  }

  if (isError) {
    return <span>Error: {error.message}</span>
  }

  return (
    <div className="flex flex-col items-center justify-center">
      {data.map((task: TaskModel) => (
        <Task task={task} />
      ))}
    </div>
  )
}
