import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'

/** Behind requireAuth: answers 401 when logged out, which is what the front end checks. */
export const me = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId }, select: { username: true } })
    res.json(user)
  } catch (error) {
    console.error('Error fetching the current user:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
