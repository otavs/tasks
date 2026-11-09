import { createHash, randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'
import type { Request, Response } from 'express'

// ---------- Usernames & passwords ----------

export const USERNAME_PATTERN = /^[a-z0-9._-]{1,32}$/
export const USERNAME_ERROR = 'username must be 1 to 32 letters, digits, ".", "_" or "-"'

export const PASSWORD_MIN_LENGTH = 8
/** scrypt doesn't care much about length, but there's no reason to hash megabytes. */
export const PASSWORD_MAX_LENGTH = 200

/** Usernames are case-insensitive: stored and compared in lowercase. */
export const normalizeUsername = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : '')

const SCRYPT = { N: 16384, r: 8, p: 1, keyLength: 64 }

const scryptAsync = (password: string, salt: Buffer, keyLength: number, options: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, keyLength, options, (error, key) => (error ? reject(error) : resolve(key)))
  )

/** "scrypt$N$r$p$salt$hash": the parameters travel with the hash, so they can be raised later. */
export async function hashPassword(password: string) {
  const { N, r, p, keyLength } = SCRYPT
  const salt = randomBytes(16)
  const hash = await scryptAsync(password, salt, keyLength, { N, r, p })
  return ['scrypt', N, r, p, salt.toString('base64'), hash.toString('base64')].join('$')
}

const NO_HASH = [
  'scrypt',
  SCRYPT.N,
  SCRYPT.r,
  SCRYPT.p,
  Buffer.alloc(16).toString('base64'),
  Buffer.alloc(SCRYPT.keyLength).toString('base64'),
].join('$')

/**
 * Whether the password matches the stored hash. Without a hash (unknown user, or one that can't log in) it still does
 * the full scrypt work and returns false, so the response time doesn't tell which usernames exist.
 */
export async function verifyPassword(password: string, storedHash: string | null) {
  const [, N, r, p, salt, hash] = (storedHash ?? NO_HASH).split('$')
  const expected = Buffer.from(hash, 'base64')
  const actual = await scryptAsync(password, Buffer.from(salt, 'base64'), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  })
  return storedHash !== null && timingSafeEqual(actual, expected)
}

// ---------- Sessions ----------

const DAY_MS = 24 * 60 * 60 * 1000
/** A session expires after 30 days without use. */
export const SESSION_MAX_AGE_MS = 30 * DAY_MS
/** How often an active session gets its expiry pushed forward (one write per day, not per request). */
export const SESSION_RENEW_AFTER_MS = DAY_MS

const SESSION_COOKIE = 'tasks_session'

/** The browser keeps the token; the database only has its hash (the session id). */
export const newSessionToken = () => randomBytes(32).toString('base64url')
export const sessionIdFromToken = (token: string) => createHash('sha256').update(token).digest('hex')

export function readSessionToken(req: Request) {
  for (const cookie of req.headers.cookie?.split(';') ?? []) {
    const [name, ...value] = cookie.trim().split('=')
    if (name === SESSION_COOKIE) return value.join('=') || undefined
  }
}

// httpOnly: page scripts can't read it. SameSite=Lax: other sites can't make changes with it (no CSRF).
const cookieOptions = (req: Request) => ({ httpOnly: true, sameSite: 'lax' as const, secure: req.secure, path: '/' })

export const setSessionCookie = (req: Request, res: Response, token: string, expires: Date) =>
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(req), expires })

export const clearSessionCookie = (req: Request, res: Response) => res.clearCookie(SESSION_COOKIE, cookieOptions(req))
