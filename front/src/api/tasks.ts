import { useAtom } from 'jotai'
import { dateAtom } from '../state.ts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TaskCreateModel, TaskDateModel, TaskModel } from '../types.tsx'

const host = import.meta.env.VITE_HOST

export const useGetTasksQuery = () => {
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

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient()
  const [date] = useAtom(dateAtom)
  const queryKey = ['tasks', date.day, date.month, date.year]

  return useMutation({
    mutationFn: async (taskId: number) => {
      const tasks = queryClient.getQueryData(queryKey) as TaskModel[]
      const deletedTask = tasks.find(task => task.id == taskId)

      queryClient.setQueryData(['tasks', date.day, date.month, date.year], (prevTasks: TaskModel[]) =>
        prevTasks.filter(task => task.id != taskId)
      )

      const context = { deletedTask }

      try {
        const res = await fetch(`${host}/tasks/${taskId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete task')
        return context
      } catch (error) {
        throw { message: 'Failed to delete task', deletedTask }
      }
    },

    onError: (error: { message: string; deletedTask?: TaskModel }) => {
      const deletedTask = error.deletedTask as TaskModel
      queryClient.setQueryData(queryKey, (prevTasks: TaskModel[]) => [...prevTasks, deletedTask])
    },
  })
}

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

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient()
  const [date] = useAtom(dateAtom)

  return useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      const res = await fetch(`${host}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error('Failed to update task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', date.day, date.month, date.year] })
    },
  })
}

export const useReorderTaskMutation = () => {
  const queryClient = useQueryClient()
  const [date] = useAtom(dateAtom)

  return useMutation({
    mutationFn: async (payload: { id: number; newPosition: number }) => {
      const res = await fetch(`${host}/tasks/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to reorder tasks')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', date.day, date.month, date.year] })
    },
  })
}

export const useMoveTaskMutation = () => {
  const queryClient = useQueryClient()
  const [date] = useAtom(dateAtom)

  return useMutation({
    mutationFn: async (payload: { id: number; date: TaskDateModel }) => {
      const res = await fetch(`${host}/tasks/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to move task')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', date.day, date.month, date.year] })
    },
  })
}
