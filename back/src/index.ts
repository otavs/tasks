import express from 'express'
import cors from 'cors'
import { prisma } from './prisma.ts'

import type { Request, Response } from 'express'

const port = 3000

const app = express()
app.use(express.json())

app.use(cors())

app.post('/tasks', async (req: Request, res: Response) => {
  const task = await prisma.task.create({
    data: {
      title: req.body.title,
      day: req.body.date.day,
      month: req.body.date.month,
      year: req.body.date.year,
    },
  })

  res.status(201).json(task)
})

app.get('/tasks/:date', async (req: Request, res: Response) => {
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
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

app.delete('/tasks/:id', async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const deletedTask = await prisma.task.delete({
      where: { id: Number(id) },
    })
    res.json({ message: 'Task deleted successfully', task: deletedTask })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
