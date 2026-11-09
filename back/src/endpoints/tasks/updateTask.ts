import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'
import { isValidTime, MAX_TITLE_LENGTH, placeLast, resequenceDay } from '../../utils/taskOrder.ts'
import { isTaskType, TASK_TYPE_ERROR } from '../../utils/taskTypes.ts'

export const updateTask = async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { title, time, inProgress, type } = req.body
  const trimmedTitle = typeof title === 'string' ? title.trim() : ''

  if (title === undefined && time === undefined && inProgress === undefined && type === undefined) {
    res.status(400).json({ error: 'title, time, inProgress or type is required' })
    return
  }

  if (type !== undefined && !isTaskType(type)) {
    res.status(400).json({ error: TASK_TYPE_ERROR })
    return
  }

  if (inProgress !== undefined && typeof inProgress !== 'boolean') {
    res.status(400).json({ error: 'inProgress must be a boolean' })
    return
  }

  if (title !== undefined && !trimmedTitle) {
    res.status(400).json({ error: 'Title cannot be empty' })
    return
  }

  if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    res.status(400).json({ error: 'title is too long' })
    return
  }

  if (time !== undefined && !isValidTime(time)) {
    res.status(400).json({ error: 'time must be an integer number of minutes between 0 and 1439' })
    return
  }

  try {
    const task = await prisma.task.findFirst({ where: { id, userId: req.userId } })

    if (!task) {
      res.status(404).json({ error: 'Task not found' })
      return
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id },
        data: {
          ...(title !== undefined && { title: trimmedTitle }),
          ...(time !== undefined && { time }),
          ...(inProgress !== undefined && { inProgress }),
          ...(type !== undefined && { type }),
        },
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
