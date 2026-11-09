import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'
import {
  newSessionToken,
  normalizeUsername,
  PASSWORD_MAX_LENGTH,
  readSessionToken,
  SESSION_MAX_AGE_MS,
  sessionIdFromToken,
  setSessionCookie,
  verifyPassword,
} from '../../utils/auth.ts'

/** Rate limited in src/routers/authRouter.ts. Accounts without a password (like "demo") can never log in. */
export const login = async (req: Request, res: Response) => {
  const username = normalizeUsername(req.body?.username)
  const password = req.body?.password

  if (!username || typeof password !== 'string' || !password || password.length > PASSWORD_MAX_LENGTH) {
    res.status(400).json({ error: 'Enter your username and password' })
    return
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } })

    // Same message (and, see verifyPassword, same time) whether the username exists or not.
    if (!(await verifyPassword(password, user?.passwordHash ?? null)) || !user) {
      res.status(401).json({ error: 'Wrong username or password' })
      return
    }

    const token = newSessionToken()
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS)
    const previousToken = readSessionToken(req)

    await prisma.$transaction([
      // Housekeeping: expired sessions, and the one this browser is replacing.
      prisma.session.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            ...(previousToken ? [{ id: sessionIdFromToken(previousToken) }] : []),
          ],
        },
      }),
      prisma.session.create({ data: { id: sessionIdFromToken(token), userId: user.id, expiresAt } }),
    ])

    setSessionCookie(req, res, token, expiresAt)
    res.json({ username: user.username })
  } catch (error) {
    console.error('Error logging in:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
