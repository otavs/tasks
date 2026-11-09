import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'
import { materializeRecurrences } from '../../utils/recurrences.ts'

export const listTasks = async (req: Request, res: Response) => {
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
    // The client asks for this only for its "today": the start of a day creates its recurring tasks.
    if (req.query.materialize === '1') {
      await materializeRecurrences(req.userId, { day, month, year })
    }

    const tasks = await prisma.task.findMany({
      where: { userId: req.userId, day, month, year },
      orderBy: [{ time: 'asc' }, { position: 'asc' }],
    })
    res.json(tasks)
  } catch (error) {
    console.error('Error listing tasks:', error)
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
}
