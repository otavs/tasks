import express from 'express'
import cors from 'cors'

import { taskRouter } from './routers/taskRouter.ts'
import { rateLimiter } from './middlewares/rateLimit.ts'

const port = 3000

const app = express()

app.use(express.json())
app.use(cors())
app.use(rateLimiter)
app.use('/tasks', taskRouter)

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
