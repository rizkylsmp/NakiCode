import cors from 'cors';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import helmet from 'helmet';
import { config } from './config';
import { getRedisClient } from './redis-cache';

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

const redisClient = getRedisClient();

const rateLimitOptions: Parameters<typeof rateLimit>[0] = {
  windowMs: config.rateLimit.windowMs,
  standardHeaders: true,
  legacyHeaders: false,
};

if (redisClient) {
  rateLimitOptions.store = new RedisStore({
    // @ts-expect-error - type mismatch between ioredis and rate-limit-redis
    sendCommand: async (...args: string[]) => redisClient.call(...args),
  });
}

export const apiRateLimit = rateLimit({
  ...rateLimitOptions,
  limit: config.rateLimit.apiLimit,
});

export const authRateLimit = rateLimit({
  ...rateLimitOptions,
  limit: config.rateLimit.authLimit,
});
