import Redis from "ioredis";

class RedisService {
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!RedisService.instance) {
      RedisService.instance = new Redis({
        host: process.env.REDIS_HOST ?? "127.0.0.1",
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD || undefined,
      });

      RedisService.instance.on("error", (err: Error) => {
        console.error("Redis error:", err.message);
      });

      RedisService.instance.on("connect", () => console.log("Redis connected"));
    }

    return RedisService.instance;
  }
}

export const redis = RedisService.getInstance();

/**
 * Safely retrieve a JSON-parsed object from Redis
 */
export async function getJsonCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[Redis] Error getting key "${key}":`, err);
    return null;
  }
}

/**
 * Safely store a JSON-serializable object in Redis with optional TTL in seconds
 */
export async function setJsonCache(
  key: string,
  value: any,
  ttlSeconds?: number
): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await redis.set(key, serialized, "EX", ttlSeconds);
    } else {
      await redis.set(key, serialized);
    }
  } catch (err) {
    console.warn(`[Redis] Error setting key "${key}":`, err);
  }
}

/**
 * Safely delete one or more keys from Redis
 */
export async function deleteCache(
  ...keys: (string | undefined | null)[]
): Promise<void> {
  try {
    const validKeys = keys.filter((k): k is string => Boolean(k));
    if (validKeys.length > 0) {
      await redis.del(...validKeys);
    }
  } catch (err) {
    console.warn(`[Redis] Error deleting keys:`, err);
  }
}

/**
 * Safely delete keys matching a pattern (e.g. "project:123:*")
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn(`[Redis] Error deleting pattern "${pattern}":`, err);
  }
}
