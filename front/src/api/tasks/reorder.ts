import { useMutation, useQueryClient } from '@tanstack/react-query'
import { produce } from 'immer'
import { useAtomValue } from 'jotai'

import { request, taskListKey } from '../api'
import { dateAtom } from '@/state/state'
import { TaskModel } from '@/typings/types'

type Payload = {
  id: number
  newPosition: number
}

export const useReorderTaskMutation = () => {
  const queryClient = useQueryClient()
  const date = useAtomValue(dateAtom)

  return useMutation({
    onMutate: async ({ id, newPosition }: Payload) => {
      const queryKey = taskListKey(date)
      await queryClient.cancelQueries({ queryKey })

      const prevTasks = queryClient.getQueryData<TaskModel[]>(queryKey)

      queryClient.setQueryData<TaskModel[]>(queryKey, (tasks = []) =>
        produce(tasks, draft => {
          const currentIndex = draft.findIndex(task => task.id === id)
          if (currentIndex === -1) return

          const [reorderedTask] = draft.splice(currentIndex, 1)
          draft.splice(newPosition, 0, reorderedTask)
          draft.forEach((task, index) => {
            task.position = index
          })
        })
      )

      return { prevTasks, queryKey }
    },

    mutationFn: (payload: Payload) => request('/tasks/reorder', { method: 'PUT', json: payload }),

    onError: (_error, _variables, context) => {
      if (!context?.prevTasks) return
      queryClient.setQueryData(context.queryKey, context.prevTasks)
    },
  })
}
