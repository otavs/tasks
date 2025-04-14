import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { dateAtom } from '../../state'
import { host, taskListKey } from '../api'
import { TaskDateModel, TaskModel } from '../../types'

type Payload = {
  title: string
  date: TaskDateModel
}

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient()
  const [date] = useAtom(dateAtom)
  const queryKey = taskListKey(date)

  return useMutation({
    mutationFn: async (task: Payload): Promise<TaskModel> => {
      const res = await fetch(`${host}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })

      if (!res.ok) throw (await res.json()).message
      return res.json()
    },

    onMutate: async newTask => {
      await queryClient.cancelQueries({ queryKey })

      const tasks = queryClient.getQueryData<TaskModel[]>(queryKey)

      const uid = -Date.now()

      const optimisticTask: TaskModel = {
        id: -1,
        uid,
        title: newTask.title,
        date: newTask.date,
        position: tasks ? tasks.length : 0,
      }

      queryClient.setQueryData<TaskModel[]>(queryKey, (old = []) => [...old, optimisticTask])

      return { uid }
    },

    onError: (_err, _newTask, context) => {
      if (!context?.uid) {
        return
      }
      queryClient.setQueryData(queryKey, (prevTasks: TaskModel[]) => prevTasks.filter(task => task.id !== context.uid))
    },

    onSuccess: (data, _newTask, context) => {
      if (!context?.uid) {
        return
      }

      queryClient.setQueryData(queryKey, (prevTasks: TaskModel[]) =>
        prevTasks.map(task => (task.uid === context.uid ? { ...task, id: data.id } : task))
      )
    },
  })
}
