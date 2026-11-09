import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'

export const updateTask = async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { title } = req.body
  const trimmedTitle = typeof title === 'string' ? title.trim() : ''

  if (!trimmedTitle) {
    res.status(400).json({ error: 'Title is required' })
    return
  }

  try {
    const task = await prisma.task.findUnique({ where: { id } })

    if (!task) {
      res.status(404).json({ error: 'Task not found' })
      return
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { title: trimmedTitle },
    })

    res.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
