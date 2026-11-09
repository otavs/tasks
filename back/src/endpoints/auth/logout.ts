import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'
import { clearSessionCookie, readSessionToken, sessionIdFromToken } from '../../utils/auth.ts'

export const logout = async (req: Request, res: Response) => {
  const token = readSessionToken(req)

  try {
    if (token) await prisma.session.deleteMany({ where: { id: sessionIdFromToken(token) } })
    clearSessionCookie(req, res)
    res.json({ message: 'Logged out' })
  } catch (error) {
    console.error('Error logging out:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
