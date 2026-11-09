import { Router } from 'express'
import { login } from '../endpoints/auth/login.ts'
import { logout } from '../endpoints/auth/logout.ts'
import { me } from '../endpoints/auth/me.ts'
import { requireAuth } from '../middlewares/auth.ts'
import { loginClientLimiter, loginUsernameLimiter } from '../middlewares/rateLimit.ts'

export const authRouter = Router()

authRouter.post('/login', loginClientLimiter, loginUsernameLimiter, login)
authRouter.post('/logout', logout)
authRouter.get('/me', requireAuth, me)
