import express from 'express'
import cors from 'cors'
import { prisma } from './prisma.ts'

import type { Request, Response } from 'express'

const port = 3000

const app = express()
app.use(express.json())

app.use(cors())

app.post('/tasks', async (req: Request, res: Response) => {
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

app.post('/tasks/reorder', async (req, res) => {
  const { id, newPosition } = req.body

  if (id === undefined || newPosition === undefined) {
    res.status(400).json({ error: 'newPosition, day, month, and year are required' })
    return
  }

  try {
    const task = await prisma.task.findFirst({
      where: { id: Number(id) },
    })

    if (!task) {
      res.status(404).json({ error: 'Task not found' })
      return
    }

    const { day, month, year } = task
    const oldIndex = task.position
    const newIndex = Number(newPosition)

    await prisma.$transaction(async (tx) => {
      if (oldIndex < newIndex) {
        await tx.task.updateMany({
          where: { position: { gt: oldIndex, lte: newIndex }, day, month, year },
          data: { position: { decrement: 1 } },
        })
      } else {
        await tx.task.updateMany({
          where: { position: { gte: newIndex, lt: oldIndex }, day, month, year },
          data: { position: { increment: 1 } },
        })
      }

      await tx.task.update({
        where: { id: task.id },
        data: { position: newIndex },
      })
    })

    res.json({ message: 'Task reordered successfully' })
  } catch (error) {
    console.error('Error reordering tasks:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
