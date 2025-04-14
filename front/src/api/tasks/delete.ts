import { useAtom } from 'jotai'

import { host, taskListKey } from '../api'
import { dateAtom } from '@/state/state'
import { TaskModel } from '@/typings/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient()
  const [date] = useAtom(dateAtom)
  const queryKey = taskListKey(date)

  return useMutation({
    onMutate: async (taskId: number) => {
      await queryClient.cancelQueries({ queryKey })

      const tasks = queryClient.getQueryData(queryKey) as TaskModel[]
      const deletedTask = tasks?.find(task => task.id == taskId)
      if (!deletedTask) throw 'Task not found'

      queryClient.setQueryData(queryKey, (prevTasks: TaskModel[] = []) => prevTasks.filter(task => task.id !== taskId))

      return { deletedTask }
    },

    mutationFn: async (taskId: number) => {
      const res = await fetch(`${host}/tasks/${taskId}`, { method: 'DELETE' })
      if (!res.ok) throw (await res.json()).message
    },

    onError: (_error, _variables, context) => {
      if (!context?.deletedTask) return
      queryClient.setQueryData(queryKey, (prevTasks: TaskModel[]) => [...prevTasks, context.deletedTask])
    },
  })
}
