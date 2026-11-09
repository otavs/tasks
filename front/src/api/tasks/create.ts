import { useMutation, useQueryClient } from '@tanstack/react-query'

import { request, taskListKey } from '../api'
import { newUid } from './list'
import { TaskDateModel, TaskModel } from '@/typings/types'
import { DEFAULT_TASK_TYPE, TaskType } from '@/utils/taskTypes'
import { resequence } from '@/utils/time'

type Payload = {
  title: string
  date: TaskDateModel
  time: number
  inProgress?: boolean
  type?: TaskType
  /** Put back at this index instead of the end of its time group (used by "undo"). */
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
        const optimisticTask: TaskModel = {
          id: -1,
          uid,
          inProgress: false,
          type: DEFAULT_TASK_TYPE,
          ...newTask,
          position: old.length,
        }
        const next = [...old]
        next.splice(Math.min(newTask.position ?? old.length, old.length), 0, optimisticTask)
        return resequence(next)
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
