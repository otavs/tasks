import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { taskRouter } from './routers/taskRouter.ts'
import { rateLimiter } from './middlewares/rateLimit.ts'

const app = express()

app.set('trust proxy', 1)
app.use(rateLimiter)

if (process.env.ENV === 'production') {
  const dirName = path.dirname(fileURLToPath(import.meta.url))
  const frontDistPath = path.join(dirName, '../../front/dist')
  app.use(express.static(frontDistPath))
}

app.use(express.json())
app.use(cors())
app.use('/tasks', taskRouter)

app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`)
})
