import { Router, type RequestHandler } from 'express'
import { actAsDemoUser } from '../middlewares/auth.ts'
import { demoGlobalWriteLimiter, demoLimiter, demoWriteLimiter } from '../middlewares/rateLimit.ts'
import { scheduleDemoTrim } from '../utils/demo.ts'
import { recurrenceRouter } from './recurrenceRouter.ts'
import { taskRouter } from './taskRouter.ts'

/** After anything that can add data (GET ?materialize=1 creates recurring tasks), keep the demo under its limits. */
const trimAfterChanges: RequestHandler = (req, res, next) => {
  if (req.method !== 'GET' || req.query.materialize !== undefined) res.on('finish', scheduleDemoTrim)
  next()
}

/** The public demo: the same API as /tasks and /recurrences, without login, all on the shared demo account. */
export const demoRouter = Router()

demoRouter.use(demoLimiter, demoWriteLimiter, demoGlobalWriteLimiter, actAsDemoUser, trimAfterChanges)
demoRouter.use('/tasks', taskRouter)
demoRouter.use('/recurrences', recurrenceRouter)
