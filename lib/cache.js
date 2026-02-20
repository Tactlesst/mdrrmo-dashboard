import { getOrSetCache } from '@/lib/inMemoryCache';

let redisClientPromise;

async function getRedisClient() {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (!redisClientPromise) {
    redisClientPromise = (async () => {
      const mod = await import('redis');
      const client = mod.createClient({ url });
      client.on('error', () => {
        // ignore
      });
      await client.connect();
      return client;
    })();
  }

  try {
    return await redisClientPromise;
  } catch {
    redisClientPromise = null;
    return null;
  }
}

export async function getOrSetJsonCache(key, ttlMs, loader) {
  const redis = await getRedisClient();
  if (!redis) {
    return getOrSetCache(key, ttlMs, loader);
  }

  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const value = await loader();
    try {
      await redis.set(key, JSON.stringify(value), { PX: ttlMs });
    } catch {
      // ignore
    }
    return value;
  } catch {
    return getOrSetCache(key, ttlMs, loader);
  }
}
