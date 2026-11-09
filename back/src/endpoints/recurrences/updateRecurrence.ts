import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'
import {
  materializeRecurrences,
  parseApplyToday,
  parseRecurrence,
  recurrenceInclude,
} from '../../utils/recurrences.ts'

/**
 * Replaces a recurrence. Days that already got their tasks keep them as they are; the changes apply
 * from the next day (or, with applyToday, to today's remaining items if today hadn't run yet).
 */
export const updateRecurrence = async (req: Request, res: Response) => {
  const id = Number(req.params.id)

  const input = parseRecurrence(req.body)
  if (typeof input === 'string') {
    res.status(400).json({ error: input })
    return
  }

  const applyToday = parseApplyToday(req.body)
  if (typeof applyToday === 'string') {
    res.status(400).json({ error: applyToday })
    return
  }

  try {
    if (!(await prisma.recurrence.findUnique({ where: { id } }))) {
      res.status(404).json({ error: 'Recurrence not found' })
      return
    }

    const { items, ...fields } = input
    await prisma.$transaction([
      prisma.recurrenceItem.deleteMany({ where: { recurrenceId: id } }),
      prisma.recurrence.update({ where: { id }, data: { ...fields, items: { create: items } } }),
    ])

    if (applyToday) {
      await materializeRecurrences(applyToday.date, { fromTime: applyToday.fromTime, recurrenceId: id })
    }

    res.json(await prisma.recurrence.findUnique({ where: { id }, include: recurrenceInclude }))
  } catch (error) {
    console.error('Error updating recurrence:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
