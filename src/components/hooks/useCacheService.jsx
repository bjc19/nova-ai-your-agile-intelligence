/**
 * Smart Cache Service with TTL and Request Deduplication
 * Prevents 429 rate limiting by:
 * 1. Caching results with configurable TTL
 * 2. Deduplicating parallel requests for same data
 * 3. Providing fallback to stale data if request fails
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map(); // Track in-flight requests
  }

  /**
   * Get cached data or fetch if expired/missing
   * If multiple requests for same key happen simultaneously, returns same promise
   */
  async get(key, fetchFn, ttlSeconds = 300) {
    const now = Date.now();
    const cached = this.cache.get(key);

    // Return fresh cache
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    // Return pending request if already in flight (deduplication)
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request and track it
    const promise = fetchFn()
      .then(data => {
        this.cache.set(key, {
          data,
          expiresAt: now + ttlSeconds * 1000
        });
        this.pendingRequests.delete(key);
        return data;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        // Return stale cache on error if available
        if (cached) {
          console.warn(`Cache fetch failed for ${key}, returning stale data`);
          return cached.data;
        }
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Force invalidate cache for a key
   */
  invalidate(key) {
    this.cache.delete(key);
    this.pendingRequests.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

// Singleton instance
const cacheServiceInstance = new CacheService();

/**
 * Hook to use cache with TTL - simplifies component integration
 * Usage: const data = useCachedData('key', fetchFn, 300);
 */
export function useCachedData(key, fetchFn, ttlSeconds = 300) {
  const React = require('react');
  const [data, setData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    setIsLoading(true);
    cacheServiceInstance
      .get(key, fetchFn, ttlSeconds)
      .then(result => {
        setData(result);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err);
        setIsLoading(false);
      });
  }, [key, ttlSeconds]);

  return { data, isLoading, error };
}

/**
 * Direct access to cache service for manual cache management
 */
export function getCacheService() {
  return cacheServiceInstance;
}