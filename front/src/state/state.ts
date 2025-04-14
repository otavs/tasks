import { atom } from 'jotai'

import { TaskDateModel, TaskModel } from '@/typings/types'

const today = new Date()

export const dateAtom = atom<TaskDateModel>({
  day: today.getDate(),
  month: today.getMonth() + 1,
  year: today.getFullYear(),
})

export const taskEditAtom = atom<TaskModel>()
export const isEditingTaskAtom = atom(false)

export const isDraggingTaskAtom = atom(false)
export const draggingTaskIdAtom = atom<number | null>()
