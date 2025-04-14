import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { produce } from 'immer'
import { dateAtom } from '../../state'
import { host, taskListKey } from '../api'
import { TaskModel } from '../../types'

type Payload = {
  id: number
  newPosition: number
}

export const useReorderTaskMutation = () => {
  const queryClient = useQueryClient()
  const [date] = useAtom(dateAtom)
  const queryKey = taskListKey(date)

  return useMutation({
    onMutate: async ({ id, newPosition }: Payload) => {
      await queryClient.cancelQueries({ queryKey })

      const tasks = queryClient.getQueryData(queryKey) as TaskModel[]

      queryClient.setQueryData(queryKey, (prevTasks: TaskModel[] = []) =>
        produce(prevTasks, newTasks => {
          const currentIndex = newTasks.findIndex(task => task.id === id)
          if (currentIndex === -1) return

          const [reorderedTask] = newTasks.splice(currentIndex, 1)
          newTasks.splice(newPosition, 0, reorderedTask)
          newTasks.forEach((task, index) => {
            task.position = index
          })
        })
      )

      return { prevTasks: tasks }
    },

    mutationFn: async (payload: { id: number; newPosition: number }) => {
      const res = await fetch(`${host}/tasks/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw (await res.json()).message
      return res.json()
    },

    onError: (_error, _variables, context) => {
      if (!context?.prevTasks) return
      queryClient.setQueryData(queryKey, () => context.prevTasks)
    },
  })
}
