import { host, taskListKey } from '@api/api'
import { dateAtom } from '@state/state'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TaskModel } from '@typings/types'
import { useAtom } from 'jotai'

type Payload = {
  id: number
  title: string
}

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient()
  const [date] = useAtom(dateAtom)
  const queryKey = taskListKey(date)

  return useMutation({
    onMutate: async ({ id, title }: Payload) => {
      await queryClient.cancelQueries({ queryKey })

      const tasks = queryClient.getQueryData(queryKey) as TaskModel[]
      const task = tasks?.find(task => task.id == id)
      if (!task) throw 'Task not found'

      queryClient.setQueryData(queryKey, (prevTasks: TaskModel[] = []) =>
        prevTasks.map(task => (task.id === id ? { ...task, title } : task))
      )

      return { task }
    },

    mutationFn: async ({ id, title }: Payload) => {
      const res = await fetch(`${host}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      if (!res.ok) throw (await res.json()).message

      return res.json()
    },

    onError: (_error, _variables, context) => {
      if (!context?.task) return
      queryClient.setQueryData(queryKey, (prevTasks: TaskModel[]) =>
        prevTasks.map(task => (task.id === context.task.id ? context.task : task))
      )
    },
  })
}
