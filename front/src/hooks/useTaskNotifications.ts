import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { useEffect, useRef } from 'react'

import { tasksQueryOptions } from '@/api/tasks/list'
import { notifyTask } from '@/state/notifications'
import { nowMinutesAtom, todayAtom } from '@/state/state'
import { dateKey } from '@/utils/date'

/**
 * Pings you when a task's time comes (unless it's already "loading"). Checks the whole range of
 * minutes since the last check, so a throttled background tab still catches up on what it missed.
 */
export function useTaskNotifications() {
  const queryClient = useQueryClient()
  const today = useAtomValue(todayAtom)
  const nowMinutes = useAtomValue(nowMinutesAtom)
  const { data: tasks } = useQuery(tasksQueryOptions(today, queryClient))

  // Start from "now": tasks that were already due when the app opened don't ping.
  const lastChecked = useRef({ day: dateKey(today), minutes: nowMinutes })
  const notified = useRef(new Set<string>())

  useEffect(() => {
    const day = dateKey(today)
    // A new day starts from just before midnight, so 00:00 tasks still ping.
    const from = lastChecked.current.day === day ? lastChecked.current.minutes : -1
    if (nowMinutes <= from) return

    for (const task of tasks ?? []) {
      const key = `${day}:${task.id}:${task.time}`
      if (task.id === -1 || task.inProgress || notified.current.has(key)) continue
      if (task.time > from && task.time <= nowMinutes) {
        notified.current.add(key)
        notifyTask(task)
      }
    }

    lastChecked.current = { day, minutes: nowMinutes }
  }, [today, nowMinutes, tasks])
}
