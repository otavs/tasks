import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { request, taskListKey } from './api'
import { RecurrenceInput, RecurrenceModel } from '@/typings/types'
import { todayTaskDate } from '@/utils/date'

export const recurrencesKey = ['recurrences']

export const useRecurrencesQuery = () =>
  useQuery({ queryKey: recurrencesKey, queryFn: () => request<RecurrenceModel[]>('/recurrences') })

const nowMinutes = () => {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

export const useSaveRecurrenceMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: RecurrenceInput & { id?: number }) => {
      // Today gets the items that haven't passed yet (if it hadn't run); later days get everything.
      const json = { ...input, applyToday: { date: todayTaskDate(), fromTime: nowMinutes() } }
      return id
        ? request<RecurrenceModel>(`/recurrences/${id}`, { method: 'PUT', json })
        : request<RecurrenceModel>('/recurrences', { method: 'POST', json })
    },

    // Optimistic for edits (e.g. the on/off switch); new ones just appear once saved.
    onMutate: async ({ id, name, weekdays, enabled }) => {
      if (!id) return
      await queryClient.cancelQueries({ queryKey: recurrencesKey })
      const previous = queryClient.getQueryData<RecurrenceModel[]>(recurrencesKey)
      queryClient.setQueryData<RecurrenceModel[]>(recurrencesKey, (list = []) =>
        list.map(recurrence => (recurrence.id === id ? { ...recurrence, name, weekdays, enabled } : recurrence))
      )
      return { previous }
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(recurrencesKey, context.previous)
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: recurrencesKey })
      queryClient.invalidateQueries({ queryKey: taskListKey(todayTaskDate()) })
    },
  })
}

export const useDeleteRecurrenceMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => request(`/recurrences/${id}`, { method: 'DELETE' }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: recurrencesKey })
      // Its tasks stay, but lose the recurring icon.
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
