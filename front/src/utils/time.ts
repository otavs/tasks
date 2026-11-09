import { TaskModel } from '@/typings/types'

export const MINUTES_IN_DAY = 24 * 60
const LAST_MINUTE = MINUTES_IN_DAY - 1
const DEFAULT_TIME = 9 * 60

export function formatTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/** Display order: by time, then by position. */
export function sortTasks(tasks: TaskModel[]) {
  return [...tasks].sort((a, b) => a.time - b.time || a.position - b.position)
}

/**
 * Sorts by time while keeping the given order among equal times (the sort is stable),
 * then renumbers positions to match. Mirrors the backend's resequencing.
 */
export function resequence(tasks: TaskModel[]) {
  return [...tasks].sort((a, b) => a.time - b.time).map((task, position) => ({ ...task, position }))
}

const NICE_STEPS = [60, 30, 15, 5, 1]

/**
 * The time a task should have once placed between `prev` and `next` (either may be missing).
 * Keeps the current time when it still fits; otherwise picks a "round" time that does.
 */
export function inferTime(current: number, prev?: number, next?: number): number {
  if ((prev === undefined || prev <= current) && (next === undefined || current <= next)) return current

  // Moved to the top: the half hour before the first task.
  if (prev === undefined) return Math.max(0, Math.ceil(next! / 30) * 30 - 30)

  // Moved to the bottom: the half hour after the last task.
  if (next === undefined) return Math.max(prev, Math.min(LAST_MINUTE, Math.floor(prev / 30) * 30 + 30))

  // In between: the roundest time strictly between the neighbours, closest to the middle.
  const middle = (prev + next) / 2
  for (const step of NICE_STEPS) {
    let best: number | undefined
    for (let t = Math.ceil((prev + 1) / step) * step; t < next; t += step) {
      if (best === undefined || Math.abs(t - middle) < Math.abs(best - middle)) best = t
    }
    if (best !== undefined) return best
  }

  // Neighbours are equal or a minute apart: share the earlier time, the position keeps the order.
  return prev
}

/** Default time for a new task: appended after the last one, and not in the past for today. */
export function suggestTime(tasks: TaskModel[] | undefined, isToday: boolean) {
  const last = tasks?.length ? Math.max(...tasks.map(task => task.time)) : undefined

  if (isToday) {
    const now = new Date()
    const nextQuarter = Math.min(LAST_MINUTE, Math.ceil((now.getHours() * 60 + now.getMinutes() + 1) / 15) * 15)
    return Math.max(last ?? 0, nextQuarter)
  }

  return last ?? DEFAULT_TIME
}
