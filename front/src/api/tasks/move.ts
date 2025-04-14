import { host, taskListKey } from '@api/api'
import { dateAtom } from '@state/state'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TaskDateModel, TaskModel } from '@typings/types'
import { useAtom } from 'jotai'

type Payload = {
  id: number
  date: TaskDateModel
}

export const useMoveTaskMutation = () => {
  const queryClient = useQueryClient()
  const [date] = useAtom(dateAtom)
  const queryKey = taskListKey(date)

  return useMutation({
    onMutate: async ({ id }: Payload) => {
      await queryClient.cancelQueries({ queryKey })

      const tasks = queryClient.getQueryData(queryKey) as TaskModel[]
      const movedTask = tasks?.find(task => task.id == id)
      if (!movedTask) throw 'Task not found'

      queryClient.setQueryData(queryKey, (prevTasks: TaskModel[] = []) => prevTasks.filter(task => task.id !== id))

      return { movedTask }
    },

    mutationFn: async (payload: Payload) => {
      const res = await fetch(`${host}/tasks/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw (await res.json()).message
    },

    onError: (_error, _variables, context) => {
      if (!context?.movedTask) return
      queryClient.setQueryData(queryKey, (prevTasks: TaskModel[]) => [...prevTasks, context.movedTask])
    },
  })
}
