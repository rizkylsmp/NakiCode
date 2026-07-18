import cors from 'cors';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import helmet from 'helmet';
import type { RequestHandler } from 'express';
import { config } from './config';
import { getRedisClient } from './redis-cache';

export const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false,
  // Don't set a strict CSP here — API endpoints are consumed by the frontend
  // which sets its own CSP. Leave content-security-policy to the frontend.
  contentSecurityPolicy: false,
});

export const permissionsPolicyHeaders: RequestHandler = (_request, response, next) => {
  response.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  );
  next();
};

export const corsMiddleware = cors({
  credentials: true,
  origin(origin, callback) {
    const isProduction = process.env.NODE_ENV === 'production';

    if (!origin) {
      callback(null, true);
      return;
    }

    if (!isProduction) {
      callback(null, true);
      return;
    }

    if (config.clientOrigins.includes(origin)) {
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
  // Disable validation for Vercel/serverless proxies that set forwarded headers
  validate: false,
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
