import { TaskDateModel } from './types'
import { atom } from 'jotai'

const today = new Date()

export const dateAtom = atom<TaskDateModel>({
  day: today.getDate(),
  month: today.getMonth() + 1,
  year: today.getFullYear(),
})
