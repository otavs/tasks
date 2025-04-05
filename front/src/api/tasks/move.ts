import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { dateAtom } from '../../state.ts'
import { host, taskListKey } from '../api.ts'
import { TaskDateModel, TaskModel } from '../../types.tsx'

export const useMoveTaskMutation = () => {
  const queryClient = useQueryClient()
  const [date] = useAtom(dateAtom)
  const queryKey = taskListKey(date)

  return useMutation({
    onMutate: async (payload: { id: number; date: TaskDateModel }) => {
      await queryClient.cancelQueries({ queryKey })

      const tasks = queryClient.getQueryData(queryKey) as TaskModel[]
      const movedTask = tasks?.find(task => task.id == payload.id)
      if (!movedTask) throw 'Task not found'

      queryClient.setQueryData(queryKey, (prevTasks: TaskModel[] = []) =>
        prevTasks.filter(task => task.id !== payload.id)
      )

      return { movedTask }
    },

    mutationFn: async (payload: { id: number; date: TaskDateModel }) => {
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
