import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'

export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const taskToDelete = await prisma.task.findUnique({
      where: { id: Number(id) },
    })

    if (!taskToDelete) {
      res.status(404).json({ message: 'Task not found' })
      return
    }

    const { position, day, month, year } = taskToDelete

    await prisma.$transaction(async (tx) => {
      await tx.task.delete({
        where: { id: Number(id) },
      })

      await tx.task.updateMany({
        where: { position: { gt: position }, day, month, year },
        data: { position: { decrement: 1 } },
      })
    })

    res.json({ message: 'Task deleted successfully', task: taskToDelete })
  } catch (error) {
    console.error('Error deleting task:', error)
    res.status(500).json({ error: 'Failed to delete task' })
  }
}
