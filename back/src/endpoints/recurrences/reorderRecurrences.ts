import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'

/** Sets the order of the list: `ids` is the user's recurrences, first to last. Ids that aren't theirs are ignored. */
export const reorderRecurrences = async (req: Request, res: Response) => {
  const { ids } = (req.body ?? {}) as { ids?: unknown }

  if (!Array.isArray(ids) || ids.length > 500 || !ids.every(Number.isInteger) || new Set(ids).size !== ids.length) {
    res.status(400).json({ error: 'ids must be a list of distinct recurrence ids' })
    return
  }

  try {
    await prisma.$transaction(
      (ids as number[]).map((id, position) =>
        prisma.recurrence.updateMany({ where: { id, userId: req.userId }, data: { position } })
      )
    )
    res.json({ message: 'Recurrences reordered successfully' })
  } catch (error) {
    console.error('Error reordering recurrences:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
