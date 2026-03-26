import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';

export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  skip: (req) => req.path === '/health' || req.path === '/metrics',
});