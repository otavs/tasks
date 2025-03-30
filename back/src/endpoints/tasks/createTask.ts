import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'

export const createTask = async (req: Request, res: Response) => {
  const { title, date = {} } = req.body
  const { day, month, year } = date

  if (!title || day === undefined || month === undefined || year === undefined) {
    res.status(400).json({ error: 'title, date.day, date.month, and date.year are required' })
    return
  }

  try {
    const lastTask = await prisma.task.findFirst({
      where: { day, month, year },
      orderBy: { position: 'desc' },
    })

    const newPosition = lastTask ? lastTask.position + 1 : 0

    const newTask = await prisma.task.create({
      data: { title, position: newPosition, day, month, year },
    })

    res.status(201).json(newTask)
  } catch (error) {
    console.error('Error creating task:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
