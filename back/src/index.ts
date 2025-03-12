import express from 'express'
import cors from 'cors'
import { prisma } from './prisma.ts'

const port = 3000

const app = express()

app.use(cors())

app.post('/task', async (req, res) => {
  const user = await prisma.task.create({
    data: {
      day: 1,
      month: 1,
      year: 2025,
      title: 'test',
    },
  })

  console.log(user)
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
