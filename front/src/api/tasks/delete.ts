import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'

import { request, taskListKey } from '../api'
import { dateAtom } from '@/state/state'
import { TaskModel } from '@/typings/types'

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient()
  const date = useAtomValue(dateAtom)

  return useMutation({
    onMutate: async (taskId: number) => {
      const queryKey = taskListKey(date)
      await queryClient.cancelQueries({ queryKey })

      const tasks = queryClient.getQueryData<TaskModel[]>(queryKey) ?? []
      const index = tasks.findIndex(task => task.id === taskId)
      if (index === -1) throw new Error('Task not found')

      queryClient.setQueryData<TaskModel[]>(queryKey, (prev = []) => prev.filter(task => task.id !== taskId))

      return { deletedTask: tasks[index], index, queryKey, date }
    },

    mutationFn: (taskId: number) => request(`/tasks/${taskId}`, { method: 'DELETE' }),

    onError: (_error, _variables, context) => {
      if (!context) return
      queryClient.setQueryData<TaskModel[]>(context.queryKey, (prev = []) => {
        const next = [...prev]
        next.splice(context.index, 0, context.deletedTask)
        return next
      })
    },
  })
}
