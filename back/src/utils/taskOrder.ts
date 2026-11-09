import type { Prisma, Task } from '@prisma/client'

type Tx = Prisma.TransactionClient
export type TaskDay = { day: number; month: number; year: number }

export const MINUTES_IN_DAY = 24 * 60
export const DEFAULT_TIME = 9 * 60

export const isValidTime = (time: unknown): time is number =>
  Number.isInteger(time) && (time as number) >= 0 && (time as number) < MINUTES_IN_DAY

/**
 * Rewrites a day's positions to 0..n-1 so they always match the display order:
 * by time first and, among tasks with the same time, by the given arrangement
 * (defaults to the current positions).
 */
export async function resequenceDay(tx: Tx, { day, month, year }: TaskDay, arrange: (tasks: Task[]) => Task[] = t => t) {
  const tasks = await tx.task.findMany({
    where: { day, month, year },
    orderBy: [{ time: 'asc' }, { position: 'asc' }, { id: 'asc' }],
  })

  // Array.prototype.sort is stable, so ties keep the arranged order.
  const ordered = arrange(tasks).sort((a, b) => a.time - b.time)

  for (const [index, task] of ordered.entries()) {
    if (task.position !== index) {
      await tx.task.update({ where: { id: task.id }, data: { position: index } })
    }
  }
}

/** Puts a task last, so after sorting it ends up at the end of its time group. */
export const placeLast = (id: number) => (tasks: Task[]) => [
  ...tasks.filter(task => task.id !== id),
  ...tasks.filter(task => task.id === id),
]

/** Puts a task at a specific index (the time sort still has the final word). */
export const placeAt = (id: number, index: number) => (tasks: Task[]) => {
  const task = tasks.find(task => task.id === id)
  if (!task) return tasks
  const rest = tasks.filter(task => task.id !== id)
  rest.splice(Math.min(Math.max(index, 0), rest.length), 0, task)
  return rest
}
