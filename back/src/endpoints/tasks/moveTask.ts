import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'

export const moveTask = async (req: Request, res: Response) => {
  const { id, date = {} } = req.body
  const { day, month, year } = date

  if (id === undefined || day === undefined || month === undefined || year === undefined) {
    res.status(400).json({ error: 'id, day, month, and year are required' })
    return
  }

  try {
    const taskToMove = await prisma.task.findUnique({
      where: { id },
    })

    if (!taskToMove) {
      res.status(404).json({ error: 'Task not found' })
      return
    }

    const { position, day: oldDay, month: oldMonth, year: oldYear } = taskToMove

    if (oldDay == day && oldMonth == month && oldYear == year) {
      res.json({ message: 'Task is already on this day, nothing done', task: taskToMove })
      return
    }

    await prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { position: { gt: position }, day: oldDay, month: oldMonth, year: oldYear },
        data: { position: { decrement: 1 } },
      })

      const lastTask = await tx.task.findFirst({
        where: { day, month, year },
        orderBy: { position: 'desc' },
      })

      const newPosition = lastTask ? lastTask.position + 1 : 0

      await tx.task.update({
        where: { id },
        data: { position: newPosition, day, month, year },
      })
    })

    res.json({ message: 'Task moved successfully', task: { ...taskToMove, day, month, year } })
  } catch (error) {
    console.error('Error moving task:', error)
    res.status(500).json({ error: 'Failed to move task' })
  }
}
