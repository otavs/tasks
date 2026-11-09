import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'
import { isValidTime, placeLast, resequenceDay } from '../../utils/taskOrder.ts'

export const updateTask = async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { title, time } = req.body
  const trimmedTitle = typeof title === 'string' ? title.trim() : ''

  if (title === undefined && time === undefined) {
    res.status(400).json({ error: 'title or time is required' })
    return
  }

  if (title !== undefined && !trimmedTitle) {
    res.status(400).json({ error: 'Title cannot be empty' })
    return
  }

  if (time !== undefined && !isValidTime(time)) {
    res.status(400).json({ error: 'time must be an integer number of minutes between 0 and 1439' })
    return
  }

  try {
    const task = await prisma.task.findUnique({ where: { id } })

    if (!task) {
      res.status(404).json({ error: 'Task not found' })
      return
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id },
        data: { ...(title !== undefined && { title: trimmedTitle }), ...(time !== undefined && { time }) },
      })

      // A new time moves the task to the end of its new time group.
      if (time !== undefined && time !== task.time) {
        await resequenceDay(tx, task, placeLast(id))
      }

      return tx.task.findUniqueOrThrow({ where: { id } })
    })

    res.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
