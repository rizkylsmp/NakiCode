import IORedis from 'ioredis';
import { config } from './config';

let redisClient: IORedis | null = null;

export function getRedisClient() {
  if (!config.cache.redisUrl) {
    return null;
  }

  if (!redisClient) {
    redisClient = new IORedis(config.cache.redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }

  return redisClient;
}

export async function getJsonCache<T>(key: string) {
  const redis = getRedisClient();

  if (!redis) {
    return null;
  }

  try {
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function setJsonCache<T>(
  key: string,
  value: T,
  ttlSeconds = config.cache.ttlSeconds,
) {
  const redis = getRedisClient();

  if (!redis) {
    return;
  }

  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Cache failures should never block the API response.
  }
}

export async function deleteCacheKeys(keys: string[]) {
  const redis = getRedisClient();

  if (!redis || keys.length === 0) {
    return;
  }

  try {
    await redis.del(...keys);
  } catch {
    // Ignore cache invalidation failures.
  }
}
