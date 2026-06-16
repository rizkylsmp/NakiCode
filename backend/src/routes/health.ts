import { Router } from 'express';
import os from 'os';
import { pingDatabase } from '../db';
import { getRedisClient } from '../redis-cache';
import { config } from '../config';

/**
 * Format bytes into human-readable format (MB)
 */
function formatBytes(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return `${Math.round(mb)} MB`;
}

/**
 * Check Redis connection status
 */
async function checkRedisStatus(): Promise<{ status: string; configured: boolean }> {
  if (!config.cache.redisUrl) {
    return { status: 'not_configured', configured: false };
  }

  try {
    const redis = getRedisClient();
    if (!redis) {
      return { status: 'offline', configured: true };
    }

    // Test Redis connection with a ping
    await redis.ping();
    return { status: 'connected', configured: true };
  } catch (error) {
    return { status: 'offline', configured: true };
  }
}

export const healthRouter = Router();

healthRouter.get('/', async (_request, response) => {
  const startTime = Date.now();
  
  // Collect system metrics
  const memoryUsage = process.memoryUsage();
  const systemMemory = {
    heapUsed: formatBytes(memoryUsage.heapUsed),
    heapTotal: formatBytes(memoryUsage.heapTotal),
    rss: formatBytes(memoryUsage.rss),
    external: formatBytes(memoryUsage.external),
  };

  // Check database status and measure latency
  let databaseStatus: { status: string; latency?: number; message?: string };
  try {
    const dbStart = Date.now();
    await pingDatabase();
    const dbLatency = Date.now() - dbStart;
    databaseStatus = { status: 'connected', latency: dbLatency };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    databaseStatus = { status: 'offline', message };
  }

  // Check Redis status
  const redisStatus = await checkRedisStatus();

  // Calculate overall health status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (databaseStatus.status === 'offline') {
    overallStatus = 'unhealthy';
  } else if (redisStatus.configured && redisStatus.status === 'offline') {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  // Build response
  const responseTime = Date.now() - startTime;
  
  response.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    service: 'naki-code-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.round(process.uptime()),
    responseTime,
    database: databaseStatus,
    redis: redisStatus,
    system: {
      memory: systemMemory,
      nodeVersion: process.version,
      platform: os.platform(),
      cpus: os.cpus().length,
    },
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
