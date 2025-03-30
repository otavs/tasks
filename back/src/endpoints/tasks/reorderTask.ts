import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'

export const reorderTask = async (req: Request, res: Response) => {
  const { id, newPosition } = req.body

  if (id === undefined || newPosition === undefined) {
    res.status(400).json({ error: 'newPosition, day, month, and year are required' })
    return
  }

  try {
    const task = await prisma.task.findFirst({
      where: { id: Number(id) },
    })

    if (!task) {
      res.status(404).json({ error: 'Task not found' })
      return
    }

    const { day, month, year } = task
    const oldIndex = task.position
    const newIndex = Number(newPosition)

    await prisma.$transaction(async (tx) => {
      if (oldIndex < newIndex) {
        await tx.task.updateMany({
          where: { position: { gt: oldIndex, lte: newIndex }, day, month, year },
          data: { position: { decrement: 1 } },
        })
      } else {
        await tx.task.updateMany({
          where: { position: { gte: newIndex, lt: oldIndex }, day, month, year },
          data: { position: { increment: 1 } },
        })
      }

      await tx.task.update({
        where: { id: task.id },
        data: { position: newIndex },
      })
    })

    res.json({ message: 'Task reordered successfully' })
  } catch (error) {
    console.error('Error reordering tasks:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
