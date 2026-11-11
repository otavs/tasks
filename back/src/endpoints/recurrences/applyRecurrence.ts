import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'
import {
  isAroundToday,
  parseTaskDay,
  recreateRecurrenceTasks,
  recurrenceInclude,
} from '../../utils/recurrences.ts'

/**
 * Adds a recurrence's tasks to today by hand (body: `{ date }`, the client's today), bringing back the ones that
 * were completed or deleted. Only today: clients can't fill arbitrary days (matters for the public demo).
 */
export const applyRecurrence = async (req: Request, res: Response) => {
  const id = Number(req.params.id)

  const date = parseTaskDay(req.body?.date)
  if (!date || !isAroundToday(date)) {
    res.status(400).json({ error: "date must be today's { day, month, year }" })
    return
  }

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
