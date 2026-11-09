import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'

import { request, taskListKey } from '../api'
import { dateAtom } from '@/state/state'
import { TaskModel } from '@/typings/types'
import { TaskType } from '@/utils/taskTypes'
import { resequence } from '@/utils/time'

type Payload = {
  id: number
  title?: string
  time?: number
  inProgress?: boolean
  type?: TaskType
}

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient()
  const date = useAtomValue(dateAtom)

  return useMutation({
    onMutate: async ({ id, title, time, inProgress, type }: Payload) => {
      const queryKey = taskListKey(date)
      await queryClient.cancelQueries({ queryKey })

      const prevTasks = queryClient.getQueryData<TaskModel[]>(queryKey) ?? []
      const task = prevTasks.find(task => task.id === id)
      if (!task) throw new Error('Task not found')

      const updated = {
        ...task,
        title: title ?? task.title,
        time: time ?? task.time,
        inProgress: inProgress ?? task.inProgress,
        type: type ?? task.type,
      }
      const timeChanged = updated.time !== task.time

      queryClient.setQueryData<TaskModel[]>(queryKey, (tasks = []) =>
        timeChanged
          ? // Like the backend: a new time sends the task to the end of its new time group.
            resequence([...tasks.filter(t => t.id !== id), updated])
          : tasks.map(t => (t.id === id ? updated : t))
      )

      return { prevTasks, queryKey }
    },

    mutationFn: ({ id, ...changes }: Payload) => request<TaskModel>(`/tasks/${id}`, { method: 'PUT', json: changes }),

    onError: (_error, _variables, context) => {
      if (!context) return
      queryClient.setQueryData(context.queryKey, context.prevTasks)
    },
  })
}
