import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { dateAtom } from '../../state.ts'
import { host } from '../api.ts'
import { TaskCreateModel } from '../../types.tsx'

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient()
  const [date] = useAtom(dateAtom)

  return useMutation({
    mutationFn: async (task: TaskCreateModel) => {
      const res = await fetch(`${host}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
      if (!res.ok) throw new Error('Failed to create task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', date.day, date.month, date.year] })
    },
  })
}