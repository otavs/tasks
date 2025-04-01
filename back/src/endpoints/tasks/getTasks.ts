import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'

export const getTasks = async (req: Request, res: Response) => {
  const { date } = req.params

  if (!date || typeof date !== 'string') {
    res.status(400).json({ error: 'Missing or invalid date format. Use dd-mm-yyyy.' })
    return
  }

  const dateParts = date.split('-').map(Number)
  if (dateParts.length !== 3 || dateParts.some(isNaN)) {
    res.status(400).json({ error: 'Invalid date format. Use dd-mm-yyyy.' })
    return
  }

  const [day, month, year] = dateParts

  try {
    const tasks = await prisma.task.findMany({
      where: { day, month, year },
    })
    res.json(tasks)
  } catch (error) {
    console.error('Error listing tasks:', error)
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
}
