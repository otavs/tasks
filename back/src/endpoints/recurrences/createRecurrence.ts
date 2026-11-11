import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'
import {
  materializeRecurrences,
  parseApplyToday,
  parseRecurrence,
  recurrenceInclude,
} from '../../utils/recurrences.ts'

export const createRecurrence = async (req: Request, res: Response) => {
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
    const { items, ...fields } = input
    // New ones go to the end of the list.
    const last = await prisma.recurrence.findFirst({
      where: { userId: req.userId },
      orderBy: { position: 'desc' },
      select: { position: true },
    })
    const recurrence = await prisma.recurrence.create({
      data: { ...fields, userId: req.userId, position: (last?.position ?? -1) + 1, items: { create: items } },
    })

    // Starting mid-day: today only gets the items that haven't passed yet.
    if (applyToday) {
      await materializeRecurrences(req.userId, applyToday.date, {
        fromTime: applyToday.fromTime,
        recurrenceId: recurrence.id,
      })
    }

    res.status(201).json(await prisma.recurrence.findUnique({ where: { id: recurrence.id }, include: recurrenceInclude }))
  } catch (error) {
    console.error('Error creating recurrence:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
