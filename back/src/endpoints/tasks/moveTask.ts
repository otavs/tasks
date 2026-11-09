import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'
import { placeLast, resequenceDay } from '../../utils/taskOrder.ts'

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

    const { day: oldDay, month: oldMonth, year: oldYear } = taskToMove

    if (oldDay == day && oldMonth == month && oldYear == year) {
      res.json({ message: 'Task is already on this day, nothing done', task: taskToMove })
      return
    }

    await prisma.$transaction(async (tx) => {
      const count = await tx.task.count({ where: { day, month, year } })

      await tx.task.update({
        where: { id },
        data: { position: count, day, month, year },
      })

      // The task keeps its time, landing at the end of that time group on the new day.
      await resequenceDay(tx, { day, month, year }, placeLast(id))
      await resequenceDay(tx, { day: oldDay, month: oldMonth, year: oldYear })
    })

    res.json({ message: 'Task moved successfully', task: { ...taskToMove, day, month, year } })
  } catch (error) {
    console.error('Error moving task:', error)
    res.status(500).json({ error: 'Failed to move task' })
  }
}
