import { useQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { dateAtom } from '../../state.ts'
import { host } from '../api.ts'
import { TaskModel } from '../../types.tsx'

export const useListTasksQuery = () => {
  const [date] = useAtom(dateAtom)

  return useQuery({
    queryKey: ['tasks', date.day, date.month, date.year],
    queryFn: async () => {
      const response = await fetch(`${host}/tasks/${date.day}-${date.month}-${date.year}`)

      if (response.status == 404) return Promise.resolve([])
      if (!response.ok) throw new Error('Failed to fetch user data')

      const tasks = (await response.json()) as TaskModel[]
      return Promise.resolve(tasks)
    },
    // refetchInterval: 10000,
  })
}
