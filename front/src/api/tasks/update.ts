import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'

import { request, taskListKey } from '../api'
import { dateAtom } from '@/state/state'
import { TaskModel } from '@/typings/types'

type Payload = {
  id: number
  title: string
}

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient()
  const date = useAtomValue(dateAtom)

  return useMutation({
    onMutate: async ({ id, title }: Payload) => {
      const queryKey = taskListKey(date)
      await queryClient.cancelQueries({ queryKey })

      const task = queryClient.getQueryData<TaskModel[]>(queryKey)?.find(task => task.id === id)
      if (!task) throw new Error('Task not found')

      queryClient.setQueryData<TaskModel[]>(queryKey, (prev = []) =>
        prev.map(task => (task.id === id ? { ...task, title } : task))
      )

      return { task, queryKey }
    },

    mutationFn: ({ id, title }: Payload) => request<TaskModel>(`/tasks/${id}`, { method: 'PUT', json: { title } }),

    onError: (_error, _variables, context) => {
      if (!context) return
      queryClient.setQueryData<TaskModel[]>(context.queryKey, (prev = []) =>
        prev.map(task => (task.id === context.task.id ? { ...task, title: context.task.title } : task))
      )
    },
  })
}
