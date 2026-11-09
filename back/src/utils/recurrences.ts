import { Prisma } from '@prisma/client'
import { prisma } from '../prisma.ts'
import { isValidTime, resequenceDay, type TaskDay } from './taskOrder.ts'

export const EVERY_DAY = 0b1111111

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'

/** Whether a weekday bitmask (bit 0 = Sunday) includes the given day. */
export const appliesOn = (weekdays: number, { day, month, year }: TaskDay) =>
  (weekdays & (1 << new Date(year, month - 1, day).getDay())) !== 0

/**
 * Creates the tasks of every enabled recurrence that applies to `date` and hasn't run for it yet.
 * Each (recurrence, day) runs at most once, so completing (deleting) its tasks never brings them back.
 *
 * `fromTime` skips items earlier than that time: used when a recurrence is created or edited mid-day,
 * so you don't get a pile of already-overdue tasks.
 */
export async function materializeRecurrences(
  date: TaskDay,
  { fromTime, recurrenceId }: { fromTime?: number; recurrenceId?: number } = {}
) {
  const { day, month, year } = date

  const recurrences = await prisma.recurrence.findMany({
    where: { enabled: true, ...(recurrenceId !== undefined && { id: recurrenceId }), runs: { none: { day, month, year } } },
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

        const count = await tx.task.count({ where: { day, month, year } })
        await tx.task.createMany({
          data: items.map((item, i) => ({
            title: item.title.trim() || recurrence.name,
            time: item.time,
            day,
            month,
            year,
            position: count + i,
            recurrenceId: recurrence.id,
          })),
        })

        // New tasks land at the end of their time group.
        await resequenceDay(tx, date)
      })
    } catch (error) {
      if (isUniqueViolation(error)) continue // another request already did it
      throw error
    }
  }
}

export type RecurrenceInput = {
  name: string
  weekdays: number
  enabled: boolean
  items: { title: string; time: number }[]
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
    const { title = '', time } = (item ?? {}) as Record<string, unknown>
    if (typeof title !== 'string' || title.length > 500) return 'item title must be a string'
    if (!isValidTime(time)) return 'item time must be an integer number of minutes between 0 and 1439'
    cleanItems.push({ title: title.trim(), time })
  }

  return { name: trimmedName, weekdays: weekdays as number, enabled, items: cleanItems }
}

/** Optional `applyToday: { date, fromTime }`: also create today's remaining tasks right away. */
export function parseApplyToday(body: unknown): { date: TaskDay; fromTime: number } | undefined | string {
  const { applyToday } = (body ?? {}) as Record<string, unknown>
  if (applyToday === undefined) return undefined

  const { date, fromTime } = (applyToday ?? {}) as { date?: Partial<TaskDay>; fromTime?: unknown }
  const { day, month, year } = date ?? {}
  if (![day, month, year].every(Number.isInteger) || !isValidTime(fromTime)) {
    return 'applyToday needs date.day, date.month, date.year and a valid fromTime'
  }

  return { date: { day: day!, month: month!, year: year! }, fromTime }
}

export const recurrenceInclude = { items: { orderBy: [{ time: 'asc' as const }, { id: 'asc' as const }] } }
