import { Prisma } from '@prisma/client'
import type { Request, Response } from 'express'
import { prisma } from '../../prisma.ts'
import {
  hashPassword,
  normalizeUsername,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_ERROR,
  USERNAME_PATTERN,
} from '../../utils/auth.ts'
import { DEMO_USERNAME } from '../../utils/demo.ts'

/** Holds the tasks and recurrences from before logins existed (see the add_users migration). */
const LEGACY_USERNAME = '#legacy'

/** Admin API only (src/admin.ts): not reachable from outside the server. */
export const createUser = async (req: Request, res: Response) => {
  const username = normalizeUsername(req.body?.username)
  const password = req.body?.password

  if (!USERNAME_PATTERN.test(username)) {
    res.status(400).json({ error: USERNAME_ERROR })
    return
  }

  if (username === DEMO_USERNAME) {
    res.status(400).json({ error: `"${DEMO_USERNAME}" is the public demo's account` })
    return
  }

  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    res.status(400).json({ error: `password must have ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters` })
    return
  }

  try {
    if (await prisma.user.findUnique({ where: { username } })) {
      res.status(409).json({ error: `User "${username}" already exists` })
      return
    }

    const passwordHash = await hashPassword(password)

    // The first user created takes over the data from before logins existed.
    const legacy = await prisma.user.findUnique({ where: { username: LEGACY_USERNAME } })
    const user = legacy
      ? await prisma.user.update({ where: { id: legacy.id }, data: { username, passwordHash } })
      : await prisma.user.create({ data: { username, passwordHash } })

    res.status(201).json({ id: user.id, username: user.username, tookOverExistingData: !!legacy })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: `User "${username}" already exists` })
      return
    }
    console.error('Error creating user:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
