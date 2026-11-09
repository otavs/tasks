declare global {
  namespace Express {
    interface Request {
      /** Who the request acts as: the logged-in user, or the demo user under /demo. Set by src/middlewares/auth.ts. */
      userId: number
    }
  }
}

export {}
