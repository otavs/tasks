import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'

import { request, taskListKey } from '../api'
import { dateAtom } from '@/state/state'
import { TaskDateModel, TaskModel } from '@/typings/types'

type Payload = {
  id: number
  date: TaskDateModel
}

export const useMoveTaskMutation = () => {
  const queryClient = useQueryClient()
  const currentDate = useAtomValue(dateAtom)

  return useMutation({
    onMutate: async ({ id, date }: Payload) => {
      const queryKey = taskListKey(currentDate)
      const targetKey = taskListKey(date)
      await Promise.all([queryClient.cancelQueries({ queryKey }), queryClient.cancelQueries({ queryKey: targetKey })])

      const tasks = queryClient.getQueryData<TaskModel[]>(queryKey) ?? []
      const index = tasks.findIndex(task => task.id === id)
      if (index === -1) throw new Error('Task not found')
      const movedTask = tasks[index]

      queryClient.setQueryData<TaskModel[]>(queryKey, (prev = []) => prev.filter(task => task.id !== id))

      // If we already have the target day cached (prefetched neighbour), show the task there right away.
      const targetTasks = queryClient.getQueryData<TaskModel[]>(targetKey)
      if (targetTasks) {
        queryClient.setQueryData<TaskModel[]>(targetKey, [
          ...targetTasks,
          { ...movedTask, date, position: targetTasks.length },
        ])
      }

      return { movedTask, index, queryKey, targetKey }
    },

    mutationFn: (payload: Payload) => request('/tasks/move', { method: 'PUT', json: payload }),

    onError: (_error, _variables, context) => {
      if (!context) return
      queryClient.setQueryData<TaskModel[]>(context.queryKey, (prev = []) => {
        const next = [...prev]
        next.splice(context.index, 0, context.movedTask)
        return next
      })
      queryClient.setQueryData<TaskModel[]>(context.targetKey, prev =>
        prev?.filter(task => task.uid !== context.movedTask.uid)
      )
    },

    onSettled: (_data, _error, _variables, context) => {
      if (context) queryClient.invalidateQueries({ queryKey: context.targetKey })
    },
  })
}
