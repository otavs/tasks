import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'
import { recurrenceInclude } from '../../utils/recurrences.ts'

export const listRecurrences = async (_req: Request, res: Response) => {
  try {
    const recurrences = await prisma.recurrence.findMany({ include: recurrenceInclude, orderBy: { id: 'asc' } })
    res.json(recurrences)
  } catch (error) {
    console.error('Error listing recurrences:', error)
    res.status(500).json({ error: 'Failed to fetch recurrences' })
  }
}
