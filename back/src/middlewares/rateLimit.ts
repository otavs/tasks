import type { Request } from 'express'
import rateLimit from 'express-rate-limit'
import { isIPv6 } from 'node:net'
import { normalizeUsername } from '../utils/auth.ts'

const MINUTE = 60 * 1000

/**
 * Who a client is, for rate limiting: its IPv4 address, or its IPv6 /64 network. A single host usually gets a whole
 * /64, so counting each IPv6 address separately would let it dodge any limit by rotating addresses.
 */
export function clientKey(req: Request) {
  const ip = req.ip ?? req.socket.remoteAddress ?? ''
  if (!isIPv6(ip) || ip.startsWith('::ffff:')) return ip

  const [head, tail] = ip.split('::')
  const headGroups = head ? head.split(':') : []
  const tailGroups = tail ? tail.split(':') : []
  const groups =
    tail === undefined
      ? headGroups
      : [...headGroups, ...Array(8 - headGroups.length - tailGroups.length).fill('0'), ...tailGroups]

  return `${groups
    .slice(0, 4)
    .map(group => parseInt(group, 16).toString(16))
    .join(':')}::/64`
}

const limiter = ({ error, ...options }: Parameters<typeof rateLimit>[0] & { error: string }) =>
  rateLimit({
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: clientKey,
    message: { error },
    ...options,
  })

const isRead = (req: Request) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS'

/** Everything, per client. */
export const rateLimiter = limiter({ windowMs: 10 * MINUTE, limit: 1000, error: 'Too many requests ;u;' })

// ---------- Login: against password guessing ----------
// Only failed attempts count (successful logins are skipped).

/** Per client: 10 failed logins per 15 minutes. */
export const loginClientLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  error: 'Too many login attempts. Try again in a few minutes.',
})

/** Per username, from all clients together, against guessing from many addresses: 20 failed logins per hour. */
export const loginUsernameLimiter = limiter({
  windowMs: 60 * MINUTE,
  limit: 20,
  skipSuccessfulRequests: true,
  keyGenerator: req => `username:${normalizeUsername(req.body?.username)}`,
  error: 'Too many login attempts. Try again later.',
})

// ---------- Demo: public, so against overload ----------
// Storage is also capped (see DEMO_LIMITS in src/utils/demo.ts).

const DEMO_ERROR = 'The demo is getting too many requests. Try again in a few minutes.'

/** Per client: 500 requests per 10 minutes (an open tab polls every 15s, ~40 of them). */
export const demoLimiter = limiter({ windowMs: 10 * MINUTE, limit: 500, error: DEMO_ERROR })

/** Changes per client: 100 per 10 minutes. */
export const demoWriteLimiter = limiter({ windowMs: 10 * MINUTE, limit: 100, skip: isRead, error: DEMO_ERROR })

/** Changes from all clients together, so many of them at once can't overload the server either: 300 per minute. */
export const demoGlobalWriteLimiter = limiter({
  windowMs: MINUTE,
  limit: 300,
  skip: isRead,
  keyGenerator: () => 'demo',
  error: DEMO_ERROR,
})
