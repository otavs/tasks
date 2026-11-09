import { arrayMove } from '@dnd-kit/sortable'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'

import { request, taskListKey } from '../api'
import { dateAtom } from '@/state/state'
import { TaskModel } from '@/typings/types'
import { resequence } from '@/utils/time'

type Payload = {
  id: number
  newPosition: number
  /** The time the task gets at its new spot (inferred when the old one breaks the order). */
  time: number
}

export const useReorderTaskMutation = () => {
  const queryClient = useQueryClient()
  const date = useAtomValue(dateAtom)

  return useMutation({
    onMutate: async ({ id, newPosition, time }: Payload) => {
      const queryKey = taskListKey(date)
      await queryClient.cancelQueries({ queryKey })

      const prevTasks = queryClient.getQueryData<TaskModel[]>(queryKey)

      queryClient.setQueryData<TaskModel[]>(queryKey, (tasks = []) => {
        const currentIndex = tasks.findIndex(task => task.id === id)
        if (currentIndex === -1) return tasks
        const moved = arrayMove(tasks, currentIndex, newPosition)
        return resequence(moved.map(task => (task.id === id ? { ...task, time } : task)))
      })

      return { prevTasks, queryKey }
    },

    mutationFn: (payload: Payload) => request('/tasks/reorder', { method: 'PUT', json: payload }),

    onError: (_error, _variables, context) => {
      if (!context?.prevTasks) return
      queryClient.setQueryData(context.queryKey, context.prevTasks)
    },
  })
}
