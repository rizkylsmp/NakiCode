import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from './config';

export const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

export const corsMiddleware = cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || config.clientOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
});

export const apiRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  limit: config.rateLimit.apiLimit,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  limit: config.rateLimit.authLimit,
  standardHeaders: true,
  legacyHeaders: false,
});
