import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'

import { TaskDateModel, TaskModel } from '@/typings/types'
import { dayDiff, isSameDay, toTaskDate, todayTaskDate } from '@/utils/date'

/** The current time, refreshed once a minute by `useNowTicker`. The single source of "now". */
export const nowAtom = atom(new Date())

/** The real current day (only changes at midnight). */
export const todayAtom = selectAtom(nowAtom, toTaskDate, isSameDay)

/** Minutes since midnight right now. */
export const nowMinutesAtom = selectAtom(nowAtom, now => now.getHours() * 60 + now.getMinutes())

const viewedDateAtom = atom<TaskDateModel>(todayTaskDate())

/** -1 when we navigated to an earlier day, 1 for a later one. Drives the slide animations. */
export const dayDirectionAtom = atom<1 | -1>(1)

/** The day being viewed. Writing to it also records the navigation direction. */
export const dateAtom = atom(
  get => get(viewedDateAtom),
  (get, set, next: TaskDateModel) => {
    const diff = dayDiff(get(viewedDateAtom), next)
    if (diff === 0) return
    set(dayDirectionAtom, diff > 0 ? 1 : -1)
    set(viewedDateAtom, next)
  }
)

export const isCreatingTaskAtom = atom(false)

export const taskEditAtom = atom<TaskModel>()
export const isEditingTaskAtom = atom(false)
/** Which field the edit form should focus (clicking a card's time focuses the time). */
export const editFocusAtom = atom<'title' | 'time'>('title')

export const isDraggingTaskAtom = atom(false)

export const isAnyModalOpenAtom = atom(get => get(isCreatingTaskAtom) || get(isEditingTaskAtom))
