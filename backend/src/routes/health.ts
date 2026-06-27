import { Router } from 'express';
import { pingDatabase } from '../db';
import { getRedisClient } from '../redis-cache';
import { config } from '../config';

/**
 * Check Redis connection status
 */
async function checkRedisStatus(): Promise<{ status: string }> {
  if (!config.cache.redisUrl) {
    return { status: 'not_configured' };
  }

  try {
    const redis = getRedisClient();
    if (!redis) {
      return { status: 'offline' };
    }

    await redis.ping();
    return { status: 'connected' };
  } catch {
    return { status: 'offline' };
  }
}

export const healthRouter = Router();

healthRouter.get('/', async (_request, response) => {
  const startTime = Date.now();

  // Check database status
  let dbStatus: string;
  try {
    await pingDatabase();
    dbStatus = 'connected';
  } catch {
    dbStatus = 'offline';
  }

  // Check Redis status
  const redisStatus = await checkRedisStatus();

  // Calculate overall health
  let overallStatus = 'healthy';
  if (dbStatus === 'offline') {
    overallStatus = 'unhealthy';
  } else if (redisStatus.status === 'offline') {
    overallStatus = 'degraded';
  }

  response.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    service: 'naki-code-api',
    version: '1.0.0',
    responseTime: Date.now() - startTime,
    database: { status: dbStatus },
    redis: { status: redisStatus.status },
  });
});

// Test endpoint to verify Sentry error tracking
// Access with: /api/health/test-error?trigger=sentry
healthRouter.get('/test-error', (request, response) => {
  if (request.query.trigger === 'sentry') {
    throw new Error('Sentry test error from backend - this is intentional for testing');
  }
  
  response.json({
    message: 'To trigger a test error, add ?trigger=sentry to the URL',
  });
});
