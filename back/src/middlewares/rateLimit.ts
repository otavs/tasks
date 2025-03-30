import rateLimit from 'express-rate-limit'

export const rateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 1000,
  message: 'Too many requests ;u;',
  standardHeaders: false,
  legacyHeaders: false,
})
