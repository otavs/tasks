import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'
import { DEFAULT_TIME, isValidTime, placeAt, placeLast, resequenceDay } from '../../utils/taskOrder.ts'

export const createTask = async (req: Request, res: Response) => {
  const { title, date = {}, position, time } = req.body
  const { day, month, year } = date
  const trimmedTitle = typeof title === 'string' ? title.trim() : ''

  if (!trimmedTitle || day === undefined || month === undefined || year === undefined) {
    res.status(400).json({ error: 'title, date.day, date.month, and date.year are required' })
    return
  }

  if (time !== undefined && !isValidTime(time)) {
    res.status(400).json({ error: 'time must be an integer number of minutes between 0 and 1439' })
    return
  }

  if (position !== undefined && (!Number.isInteger(position) || position < 0)) {
    res.status(400).json({ error: 'position must be a non-negative integer' })
    return
  }

  try {
    const newTask = await prisma.$transaction(async (tx) => {
      const where = { day, month, year }

      // Clients that don't send a time get the last task's time, i.e. the task is appended.
      const lastTask = await tx.task.findFirst({ where, orderBy: [{ time: 'desc' }, { position: 'desc' }] })
      const count = await tx.task.count({ where })

      const task = await tx.task.create({
        data: { title: trimmedTitle, time: time ?? lastTask?.time ?? DEFAULT_TIME, position: count, ...where },
      })

      // Without a position it goes to the end of its time group; with one (e.g. "undo") it's put back there.
      await resequenceDay(tx, where, position === undefined ? placeLast(task.id) : placeAt(task.id, position))

      return tx.task.findUniqueOrThrow({ where: { id: task.id } })
    })

    res.status(201).json(newTask)
  } catch (error) {
    console.error('Error creating task:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
