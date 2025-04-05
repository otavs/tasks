import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { dateAtom } from '../../state.ts'
import { host, taskListKey } from '../api.ts'
import { TaskModel } from '../../types.tsx'

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient()
  const [date] = useAtom(dateAtom)
  const queryKey = taskListKey(date)

  return useMutation({
    mutationFn: async (taskId: number) => {
      const tasks = queryClient.getQueryData(queryKey) as TaskModel[]
      const deletedTask = tasks.find(task => task.id == taskId)

      queryClient.setQueryData(queryKey, (prevTasks: TaskModel[]) =>
        prevTasks.filter(task => task.id != taskId)
      )

      const context = { deletedTask }

      try {
        const res = await fetch(`${host}/tasks/${taskId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete task')
        return context
      } catch (error) {
        throw { message: 'Failed to delete task', deletedTask }
      }
    },

    onError: (error: { message: string; deletedTask?: TaskModel }) => {
      const deletedTask = error.deletedTask as TaskModel
      queryClient.setQueryData(queryKey, (prevTasks: TaskModel[]) => [...prevTasks, deletedTask])
    },
  })
}
