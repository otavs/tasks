import { useMutation, useQueryClient } from '@tanstack/react-query'

import { request, taskListKey } from '../api'
import { newUid } from './list'
import { TaskDateModel, TaskModel } from '@/typings/types'

type Payload = {
  title: string
  date: TaskDateModel
  /** Insert at this index instead of appending (used by "undo"). */
  position?: number
}

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (task: Payload) => request<TaskModel>('/tasks', { method: 'POST', json: task }),

    onMutate: async newTask => {
      const queryKey = taskListKey(newTask.date)
      await queryClient.cancelQueries({ queryKey })

      const uid = newUid()

      queryClient.setQueryData<TaskModel[]>(queryKey, (old = []) => {
        const index = Math.min(newTask.position ?? old.length, old.length)
        const optimisticTask: TaskModel = { id: -1, uid, title: newTask.title, date: newTask.date, position: index }
        const next = [...old]
        next.splice(index, 0, optimisticTask)
        return next.map((task, position) => ({ ...task, position }))
      })

      return { uid, queryKey }
    },

    onError: (_err, _newTask, context) => {
      if (!context) return
      queryClient.setQueryData<TaskModel[]>(context.queryKey, (prev = []) =>
        prev.filter(task => task.uid !== context.uid)
      )
    },

    onSuccess: (data, _newTask, context) => {
      if (!context) return
      queryClient.setQueryData<TaskModel[]>(context.queryKey, (prev = []) =>
        prev.map(task => (task.uid === context.uid ? { ...task, id: data.id } : task))
      )
    },
  })
}
