import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'

/** Stops future tasks. Tasks it already created stay (they just lose the link). */
export const deleteRecurrence = async (req: Request, res: Response) => {
  const id = Number(req.params.id)

  try {
    if (!(await prisma.recurrence.findFirst({ where: { id, userId: req.userId } }))) {
      res.status(404).json({ error: 'Recurrence not found' })
      return
    }

    await prisma.recurrence.delete({ where: { id } })
    res.json({ message: 'Recurrence deleted successfully' })
  } catch (error) {
    console.error('Error deleting recurrence:', error)
    res.status(500).json({ error: 'Failed to delete recurrence' })
  }
}
