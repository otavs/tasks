import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'
import {
  appliesOn,
  isAroundToday,
  parseTaskDay,
  recreateRecurrenceTasks,
  recurrenceInclude,
} from '../../utils/recurrences.ts'

/** The body's `date`, which must be the client's today. Answers 400 and returns undefined otherwise. */
function todayFromBody(req: Request, res: Response) {
  const date = parseTaskDay(req.body?.date)
  if (date && isAroundToday(date)) return date
  res.status(400).json({ error: "date must be today's { day, month, year }" })
}

/**
 * Adds a recurrence's tasks to today by hand (body: `{ date }`, the client's today), bringing back the ones that
 * were completed or deleted. Only today: clients can't fill arbitrary days (matters for the public demo).
 */
export const applyRecurrence = async (req: Request, res: Response) => {
  const id = Number(req.params.id)

  const date = todayFromBody(req, res)
  if (!date) return

  try {
    const recurrence = await prisma.recurrence.findFirst({ where: { id, userId: req.userId }, include: recurrenceInclude })
    if (!recurrence) {
      res.status(404).json({ error: 'Recurrence not found' })
      return
    }

    const created = await recreateRecurrenceTasks(req.userId, recurrence, date)
    res.json({ created })
  } catch (error) {
    console.error('Error applying recurrence:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/** The same for every recurrence that runs today (enabled, and today is one of its days). */
export const applyAllRecurrences = async (req: Request, res: Response) => {
  const date = todayFromBody(req, res)
  if (!date) return

  try {
    const recurrences = await prisma.recurrence.findMany({
      where: { userId: req.userId, enabled: true },
      include: recurrenceInclude,
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    })

    let created = 0
    for (const recurrence of recurrences) {
      if (appliesOn(recurrence.weekdays, date)) created += await recreateRecurrenceTasks(req.userId, recurrence, date)
    }
    res.json({ created })
  } catch (error) {
    console.error('Error applying recurrences:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
