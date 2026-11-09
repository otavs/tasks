import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'

export const createTask = async (req: Request, res: Response) => {
  const { title, date = {}, position } = req.body
  const { day, month, year } = date
  const trimmedTitle = typeof title === 'string' ? title.trim() : ''

  if (!trimmedTitle || day === undefined || month === undefined || year === undefined) {
    res.status(400).json({ error: 'title, date.day, date.month, and date.year are required' })
    return
  }

  if (position !== undefined && (!Number.isInteger(position) || position < 0)) {
    res.status(400).json({ error: 'position must be a non-negative integer' })
    return
  }

  try {
    const newTask = await prisma.$transaction(async (tx) => {
      const count = await tx.task.count({ where: { day, month, year } })

      // Without a position the task goes to the end; with one (e.g. "undo") it's inserted there.
      const newPosition = position === undefined ? count : Math.min(position, count)

      if (newPosition < count) {
        await tx.task.updateMany({
          where: { position: { gte: newPosition }, day, month, year },
          data: { position: { increment: 1 } },
        })
      }

      return tx.task.create({
        data: { title: trimmedTitle, position: newPosition, day, month, year },
      })
    })

    res.status(201).json(newTask)
  } catch (error) {
    console.error('Error creating task:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
