const MAX_CACHE_ENTRIES = 200;
const memoryCache = new Map();

// Periodic prune to ensure dead items don't linger in memory indefinitely
function pruneExpired() {
  const now = Date.now();
  for (const [key, item] of memoryCache.entries()) {
    if (item.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}

export function getCache(key) {
  const cached = memoryCache.get(key);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  // Refresh LRU order: re-insert so it's most recently accessed
  memoryCache.delete(key);
  memoryCache.set(key, cached);

  return cached.value;
}

export function setCache(key, value, ttlSeconds = 60) {
  if (memoryCache.size >= MAX_CACHE_ENTRIES) {
    pruneExpired();
    // If still at capacity, drop the oldest entry (FIFO/LRU)
    while (memoryCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey !== undefined) {
        memoryCache.delete(oldestKey);
      } else {
        break;
      }
    }
  }

  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  return value;
}

// Delete a specific cache key immediately
export function clearCache(key) {
  memoryCache.delete(key);
}

// Delete all keys that start with a given prefix
export function clearCacheByPrefix(prefix) {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

export function cacheHeaders(ttlSeconds = 60, staleSeconds = 300) {
  return {
    'Cache-Control': `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${staleSeconds}`,
  };
}
