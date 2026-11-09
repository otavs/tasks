import { QueryClient, queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'

import { request, taskListKey } from '../api'
import { dateAtom } from '@/state/state'
import { TaskDateModel, TaskModel } from '@/typings/types'
import { isSameDay, todayTaskDate } from '@/utils/date'
import { sortTasks } from '@/utils/time'

export const newUid = () => -Math.floor(Math.random() * 1_000_000_000)

export const tasksQueryOptions = (date: TaskDateModel, queryClient: QueryClient) =>
  queryOptions({
    queryKey: taskListKey(date),
    queryFn: async () => {
      // Loading "today" is what starts the day: the server creates its recurring tasks then.
      const materialize = isSameDay(date, todayTaskDate()) ? '?materialize=1' : ''
      const tasks = await request<TaskModel[]>(`/tasks/${date.day}-${date.month}-${date.year}${materialize}`)

      // Keep the client-side uid stable across refetches so cards don't remount/re-animate.
      const prevTasks = queryClient.getQueryData<TaskModel[]>(taskListKey(date))
      tasks.forEach(task => {
        task.uid = prevTasks?.find(prevTask => prevTask.id === task.id)?.uid ?? newUid()
      })

      return sortTasks(tasks)
    },
    refetchInterval: 15000,
  })

export const useListTasksQuery = () => {
  const queryClient = useQueryClient()
  const date = useAtomValue(dateAtom)

  return useQuery(tasksQueryOptions(date, queryClient))
}
