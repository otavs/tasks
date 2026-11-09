import type { RequestHandler } from 'express'
import { prisma } from '../prisma.ts'
import {
  readSessionToken,
  SESSION_MAX_AGE_MS,
  SESSION_RENEW_AFTER_MS,
  sessionIdFromToken,
  setSessionCookie,
} from '../utils/auth.ts'
import { demoUserId } from '../utils/demo.ts'

/** Lets the request through as the logged-in user (`req.userId`), or answers 401. */
export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = readSessionToken(req)
    const session = token && (await prisma.session.findUnique({ where: { id: sessionIdFromToken(token) } }))

    if (!token || !session || session.expiresAt.getTime() <= Date.now()) {
      res.status(401).json({ error: 'Not logged in' })
      return
    }

    // Sliding expiry: a session keeps working while it's used at least once every SESSION_MAX_AGE.
    if (session.expiresAt.getTime() < Date.now() + SESSION_MAX_AGE_MS - SESSION_RENEW_AFTER_MS) {
      const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS)
      await prisma.session.updateMany({ where: { id: session.id }, data: { expiresAt } })
      setSessionCookie(req, res, token, expiresAt)
    }

    req.userId = session.userId
    next()
  } catch (error) {
    next(error)
  }
}

/** Under /demo: everything is done as the demo user, no login needed. */
export const actAsDemoUser: RequestHandler = async (req, _res, next) => {
  try {
    req.userId = await demoUserId()
    next()
  } catch (error) {
    next(error)
  }
}
