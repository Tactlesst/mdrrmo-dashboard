const store = new Map();

export async function getOrSetCache(key, ttlMs, loader) {
  const now = Date.now();
  const existing = store.get(key);
  if (existing && existing.expiresAt > now && 'value' in existing) {
    return existing.value;
  }

  if (existing && existing.expiresAt > now && existing.promise) {
    return existing.promise;
  }

  const promise = (async () => {
    const value = await loader();
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  })();

  store.set(key, { promise, expiresAt: now + ttlMs });

  try {
    return await promise;
  } catch (err) {
    store.delete(key);
    throw err;
  }
}

export function clearCache(key) {
  if (typeof key === 'string') {
    store.delete(key);
    return;
  }
  store.clear();
}
