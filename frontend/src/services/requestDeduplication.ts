/**
 * Enhanced Request Deduplication Service
 * Prevents multiple simultaneous calls to the same endpoint with improved caching
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
  retryCount: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

class RequestDeduplicationService {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly CACHE_DURATION = 60000; // 1 minute default cache
  private readonly MAX_RETRIES = 2;

  /**
   * Execute a request, deduplicating if the same request is already in progress
   * and using cache when appropriate
   */
  async execute<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: {
      useCache?: boolean;
      cacheDuration?: number;
      retryOnError?: boolean;
    } = {}
  ): Promise<T> {
    const {
      useCache = true,
      cacheDuration = this.CACHE_DURATION,
      retryOnError = true
    } = options;

    // Check cache first if enabled
    if (useCache) {
      const cached = this.getFromCache(key);
      if (cached) {
        console.log(`📦 Request served from cache for key: ${key}`);
        return cached;
      }
    }

    // Check if there's already a pending request for this key
    const existingRequest = this.pendingRequests.get(key);

    if (existingRequest) {
      // Check if the existing request is still valid (not expired)
      if (Date.now() - existingRequest.timestamp < this.REQUEST_TIMEOUT) {
        console.log(`🔄 Request deduplicated for key: ${key}`);
        return existingRequest.promise;
      } else {
        // Remove expired request
        this.pendingRequests.delete(key);
      }
    }

    // Create new request
    const promise = this.executeWithRetry(key, requestFn, retryOnError).finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });

    // Store the pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
      retryCount: 0
    });

    return promise;
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    key: string,
    requestFn: () => Promise<T>,
    retryOnError: boolean
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const result = await requestFn();

        // Cache successful result
        this.setCache(key, result);

        return result;
      } catch (error) {
        lastError = error;

        if (!retryOnError || attempt === this.MAX_RETRIES) {
          throw error;
        }

        // Exponential backoff for retries
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`🔄 Retrying request for key: ${key} in ${delay}ms (attempt ${attempt + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Get data from cache if it exists and hasn't expired
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    // Remove expired cache entry
    if (cached) {
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: any, duration: number = this.CACHE_DURATION): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration
    });
  }

  /**
   * Generate a unique key for a request based on method, URL, and parameters
   */
  generateKey(method: string, url: string, params?: any): string {
    const paramsString = params ? new URLSearchParams(params).toString() : '';
    return `${method.toUpperCase()}:${url}${paramsString ? `?${paramsString}` : ''}`;
  }

  /**
   * Clear all pending requests and cache
   */
  clear(): void {
    this.pendingRequests.clear();
    this.cache.clear();
  }

  /**
   * Clear only expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get the number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Get the number of cached entries
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Check if a specific request is pending
   */
  isPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  /**
   * Check if a specific key is cached
   */
  isCached(key: string): boolean {
    return this.getFromCache(key) !== null;
  }
}

// Export singleton instance
export const requestDeduplication = new RequestDeduplicationService();
export default requestDeduplication;
