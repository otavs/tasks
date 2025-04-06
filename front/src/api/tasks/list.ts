import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { dateAtom } from '../../state.ts'
import { host, taskListKey } from '../api.ts'
import { TaskModel } from '../../types.tsx'

export const useListTasksQuery = () => {
  const queryClient = useQueryClient()
  const [date] = useAtom(dateAtom)
  const queryKey = taskListKey(date)

  return useQuery({
    queryKey: ['tasks', date.day, date.month, date.year],
    queryFn: async () => {
      const response = await fetch(`${host}/tasks/${date.day}-${date.month}-${date.year}`)

      if (response.status == 404) return Promise.resolve([])
      if (!response.ok) throw new Error('Failed to fetch user data')

      const tasks = (await response.json()) as TaskModel[]

      const prevTasks = queryClient.getQueryData(queryKey) as TaskModel[]

      tasks.forEach(task => {
        const prevTask = prevTasks?.find(prevTask => prevTask.id == task.id)
        task.uid = prevTask ? prevTask.uid : -Math.floor(Math.random() * 1000000000)
      })

      tasks.sort((a, b) => a.position - b.position)

      return Promise.resolve(tasks)
    },
    refetchInterval: 1000,
  })
}
