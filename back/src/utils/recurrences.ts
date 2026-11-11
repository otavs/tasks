import { Prisma } from '@prisma/client'
import { prisma } from '../prisma.ts'
import { isValidTime, resequenceDay, type TaskDay } from './taskOrder.ts'
import { DEFAULT_TASK_TYPE, isTaskType, TASK_TYPE_ERROR, type TaskType } from './taskTypes.ts'

export const EVERY_DAY = 0b1111111

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'

/** Whether a weekday bitmask (bit 0 = Sunday) includes the given day. */
export const appliesOn = (weekdays: number, { day, month, year }: TaskDay) =>
  (weekdays & (1 << new Date(year, month - 1, day).getDay())) !== 0

const DAY_MS = 24 * 60 * 60 * 1000

/** Whether `date` can be "today" somewhere: time zones put it at most 2 days away from the server's own date. */
export const isAroundToday = ({ day, month, year }: TaskDay) => {
  const now = new Date()
  return Math.abs(Date.UTC(year, month - 1, day) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) <= 2 * DAY_MS
}

/**
 * Creates the tasks of a user's enabled recurrences that apply to `date` and haven't run for it yet.
 * Each (recurrence, day) runs at most once, so completing (deleting) its tasks never brings them back.
 *
 * `fromTime` skips items earlier than that time: used when a recurrence is created or edited mid-day,
 * so you don't get a pile of already-overdue tasks.
 *
 * Only "today" starts a day, so other dates are ignored: clients can't fill arbitrary days (matters for the public demo).
 */
export async function materializeRecurrences(
  userId: number,
  date: TaskDay,
  { fromTime, recurrenceId }: { fromTime?: number; recurrenceId?: number } = {}
) {
  if (!isAroundToday(date)) return

  const { day, month, year } = date

  const recurrences = await prisma.recurrence.findMany({
    where: {
      userId,
      enabled: true,
      ...(recurrenceId !== undefined && { id: recurrenceId }),
      runs: { none: { day, month, year } },
    },
    include: { items: true },
  })

  for (const recurrence of recurrences) {
    if (!appliesOn(recurrence.weekdays, date)) continue

    try {
      await prisma.$transaction(async (tx) => {
        // The run's primary key is the guard against two requests materializing the same day.
        await tx.recurrenceRun.create({ data: { recurrenceId: recurrence.id, day, month, year } })

        const items = recurrence.items.filter((item) => fromTime === undefined || item.time >= fromTime)
        if (items.length === 0) return

        const count = await tx.task.count({ where: { userId, day, month, year } })
        await tx.task.createMany({
          data: items.map((item, i) => ({
            userId,
            title: item.title.trim() || recurrence.name,
            time: item.time,
            type: item.type,
            day,
            month,
            year,
            position: count + i,
            recurrenceId: recurrence.id,
          })),
        })

        // New tasks land at the end of their time group.
        await resequenceDay(tx, { userId, ...date })
      })
    } catch (error) {
      if (isUniqueViolation(error)) continue // another request already did it
      throw error
    }
  }
}

/**
 * Adds a recurrence's tasks to `date` by hand, even if that day already got them, or the recurrence is paused or
 * doesn't apply that day. Items whose task is still there (same title and time) are skipped, so it brings back
 * what was completed or deleted without doubling the rest. Returns how many tasks it created.
 */
export async function recreateRecurrenceTasks(
  userId: number,
  recurrence: { id: number; name: string; items: { title: string; time: number; type: string }[] },
  date: TaskDay
) {
  const { day, month, year } = date
  const titleOf = (item: { title: string }) => item.title.trim() || recurrence.name

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.task.findMany({
        where: { userId, day, month, year, recurrenceId: recurrence.id },
        select: { title: true, time: true },
      })
      const left = existing.map((task) => `${task.time}|${task.title}`)
      const missing = recurrence.items.filter((item) => {
        const index = left.indexOf(`${item.time}|${titleOf(item)}`)
        if (index === -1) return true
        left.splice(index, 1) // each existing task only covers one item
        return false
      })

      // The day counts as done, so the automatic run doesn't add them all again later.
      await tx.recurrenceRun.upsert({
        where: { recurrenceId_day_month_year: { recurrenceId: recurrence.id, day, month, year } },
        create: { recurrenceId: recurrence.id, day, month, year },
        update: {},
      })

      if (missing.length === 0) return 0

      const count = await tx.task.count({ where: { userId, day, month, year } })
      await tx.task.createMany({
        data: missing.map((item, i) => ({
          userId,
          title: titleOf(item),
          time: item.time,
          type: item.type,
          day,
          month,
          year,
          position: count + i,
          recurrenceId: recurrence.id,
        })),
      })
      await resequenceDay(tx, { userId, ...date })
      return missing.length
    })
  } catch (error) {
    // The automatic run marked the day at the same moment: its tasks are being created right now.
    if (isUniqueViolation(error)) return 0
    throw error
  }
}

export type RecurrenceInput = {
  name: string
  weekdays: number
  enabled: boolean
  items: { title: string; time: number; type: TaskType }[]
}

/** Validates a recurrence body. Returns the clean input, or an error message. */
export function parseRecurrence(body: unknown): RecurrenceInput | string {
  const { name, weekdays = EVERY_DAY, enabled = true, items } = (body ?? {}) as Record<string, unknown>

  const trimmedName = typeof name === 'string' ? name.trim() : ''
  if (!trimmedName) return 'name is required'
  if (trimmedName.length > 200) return 'name is too long'

  if (!Number.isInteger(weekdays) || (weekdays as number) < 1 || (weekdays as number) > EVERY_DAY) {
    return 'weekdays must be a bitmask with at least one day (1..127)'
  }

  if (typeof enabled !== 'boolean') return 'enabled must be a boolean'

  if (!Array.isArray(items) || items.length === 0 || items.length > 50) return 'items must have 1 to 50 entries'

  const cleanItems: RecurrenceInput['items'] = []
  for (const item of items) {
    const { title = '', time, type = DEFAULT_TASK_TYPE } = (item ?? {}) as Record<string, unknown>
    if (typeof title !== 'string' || title.length > 500) return 'item title must be a string'
    if (!isValidTime(time)) return 'item time must be an integer number of minutes between 0 and 1439'
    if (!isTaskType(type)) return `item ${TASK_TYPE_ERROR}`
    cleanItems.push({ title: title.trim(), time, type })
  }

  return { name: trimmedName, weekdays: weekdays as number, enabled, items: cleanItems }
}

/** Optional `applyToday: { date, fromTime }`: also create today's remaining tasks right away. */
export function parseApplyToday(body: unknown): { date: TaskDay; fromTime: number } | undefined | string {
  const { applyToday } = (body ?? {}) as Record<string, unknown>
  if (applyToday === undefined) return undefined

  const { date, fromTime } = (applyToday ?? {}) as { date?: unknown; fromTime?: unknown }
  const day = parseTaskDay(date)
  if (!day || !isValidTime(fromTime)) return 'applyToday needs date.day, date.month, date.year and a valid fromTime'

  return { date: day, fromTime }
}

/** A `{ day, month, year }` from a request body, or undefined if it isn't one. */
export function parseTaskDay(value: unknown): TaskDay | undefined {
  const { day, month, year } = (value ?? {}) as Partial<Record<keyof TaskDay, unknown>>
  if (![day, month, year].every(Number.isInteger)) return undefined
  return { day: day as number, month: month as number, year: year as number }
}

export const recurrenceInclude = { items: { orderBy: [{ time: 'asc' as const }, { id: 'asc' as const }] } }
