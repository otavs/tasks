import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'

export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params
  const { title } = req.body

  if (!title) {
    res.status(400).json({ error: 'Title is required' })
    return
  }

  try {
    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: { title },
    })

    res.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
