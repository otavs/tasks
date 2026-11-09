import express, { type RequestHandler } from 'express'
import { createUser } from './endpoints/admin/createUser.ts'
import { adminPort } from './utils/adminPort.ts'

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

/**
 * Defense in depth: the admin server only listens on 127.0.0.1 anyway. Requests carrying proxy headers came through a
 * reverse proxy, i.e. from outside, so they're refused even if a proxy ever gets pointed here by mistake.
 */
const onlyFromThisMachine: RequestHandler = (req, res, next) => {
  const proxied = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.headers.forwarded
  if (!LOOPBACK.has(req.socket.remoteAddress ?? '') || proxied) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  next()
}

/**
 * The admin API: user creation, only for whoever has access to the server itself (`npm run create-user`).
 *
 * It's a separate server on 127.0.0.1 instead of a route on the public one: behind a reverse proxy running on the same
 * machine, every public request reaches the app from 127.0.0.1 too, so the client address can't tell them apart.
 */
export function startAdminServer() {
  const app = express()
  app.set('etag', false)
  app.use(onlyFromThisMachine)
  app.use(express.json())
  app.post('/users', createUser)

  const port = adminPort()
  app
    .listen(port, '127.0.0.1', () => console.log(`Admin API listening on http://127.0.0.1:${port}`))
    .on('error', error => console.error(`Admin API couldn't start on 127.0.0.1:${port} (set ADMIN_PORT):`, error.message))
}
