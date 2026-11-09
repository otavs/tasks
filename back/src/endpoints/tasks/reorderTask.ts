import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'
import { isValidTime, placeAt, resequenceDay } from '../../utils/taskOrder.ts'

/**
 * Moves a task to another index within its day. The client sends the time the task should
 * have at the new spot (inferred when the old one would break the time order).
 */
export const reorderTask = async (req: Request, res: Response) => {
  const { id, newPosition, time } = req.body

  if (id === undefined || !Number.isInteger(newPosition) || newPosition < 0) {
    res.status(400).json({ error: 'id and a non-negative integer newPosition are required' })
    return
  }

  if (time !== undefined && !isValidTime(time)) {
    res.status(400).json({ error: 'time must be an integer number of minutes between 0 and 1439' })
    return
  }

  try {
    const task = await prisma.task.findFirst({ where: { id: Number(id), userId: req.userId } })

    if (!task) {
      res.status(404).json({ error: 'Task not found' })
      return
    }

    await prisma.$transaction(async (tx) => {
      if (time !== undefined && time !== task.time) {
        await tx.task.update({ where: { id: task.id }, data: { time } })
      }

      await resequenceDay(tx, task, placeAt(task.id, newPosition))
    })

    res.json({ message: 'Task reordered successfully' })
  } catch (error) {
    console.error('Error reordering tasks:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
