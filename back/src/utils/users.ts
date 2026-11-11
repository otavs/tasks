import { Prisma } from '@prisma/client'
import { prisma } from '../prisma.ts'
import {
  hashPassword,
  normalizeUsername,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_ERROR,
  USERNAME_PATTERN,
} from './auth.ts'
import { DEMO_USERNAME } from './demo.ts'

/** Holds the tasks and recurrences from before logins existed (see the add_users migration). */
const LEGACY_USERNAME = '#legacy'

/** Why a user couldn't be created, worded for whoever ran `npm run create-user`. */
export class CreateUserError extends Error {}

/**
 * Creates a user. Only `npm run create-user` calls it, so creating users takes access to the server (and its database
 * file) itself. The first user created takes over the data from before logins existed.
 */
export async function createUser(rawUsername: string, password: string) {
  const username = normalizeUsername(rawUsername)

  if (!USERNAME_PATTERN.test(username)) throw new CreateUserError(USERNAME_ERROR)
  if (username === DEMO_USERNAME) throw new CreateUserError(`"${DEMO_USERNAME}" is the public demo's account`)
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw new CreateUserError(`password must have ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters`)
  }

  const alreadyExists = new CreateUserError(`User "${username}" already exists`)
  if (await prisma.user.findUnique({ where: { username } })) throw alreadyExists

  const passwordHash = await hashPassword(password)

  try {
    const legacy = await prisma.user.findUnique({ where: { username: LEGACY_USERNAME } })
    const user = legacy
      ? await prisma.user.update({ where: { id: legacy.id }, data: { username, passwordHash } })
      : await prisma.user.create({ data: { username, passwordHash } })
    return { username: user.username, tookOverExistingData: !!legacy }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw alreadyExists
    throw error
  }
}
