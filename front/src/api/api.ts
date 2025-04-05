import { TaskDateModel } from '../types.tsx'

export const host = import.meta.env.VITE_HOST

export const taskListKey = (date: TaskDateModel) => ['tasks', date.day, date.month, date.year]
