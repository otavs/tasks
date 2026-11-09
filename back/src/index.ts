import 'dotenv/config'

import express from 'express'
import nocache from 'nocache'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { startAdminServer } from './admin.ts'
import { requireAuth } from './middlewares/auth.ts'
import { rateLimiter } from './middlewares/rateLimit.ts'
import { authRouter } from './routers/authRouter.ts'
import { demoRouter } from './routers/demoRouter.ts'
import { recurrenceRouter } from './routers/recurrenceRouter.ts'
import { taskRouter } from './routers/taskRouter.ts'
import { demoUserId } from './utils/demo.ts'

const app = express()

const isProduction = process.env.ENV === 'production'
const frontDistPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../front/dist')

app.set('trust proxy', 1)
app.set('etag', false)

app.use(nocache())
app.use(rateLimiter)

if (isProduction) {
  app.use(express.static(frontDistPath))
} else {
  // In development the front end is on another port, and sends the session cookie along.
  app.use(cors({ origin: true, credentials: true }))
}

app.use(express.json())
app.use('/auth', authRouter)
app.use('/demo', demoRouter)
app.use('/tasks', requireAuth, taskRouter)
app.use('/recurrences', requireAuth, recurrenceRouter)

if (isProduction) {
  // The front end's own pages (it's a single-page app).
  app.get(['/login', '/demo'], (_req, res) => res.sendFile(path.join(frontDistPath, 'index.html')))
}

// The demo user always exists.
await demoUserId()

app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`)
})

startAdminServer()
