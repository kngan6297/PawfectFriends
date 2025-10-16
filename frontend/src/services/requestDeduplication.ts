/**
 * Request Deduplication Service
 * Prevents multiple simultaneous calls to the same endpoint
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicationService {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

  /**
   * Execute a request, deduplicating if the same request is already in progress
   */
  async execute<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
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
    const promise = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });

    // Store the pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  /**
   * Generate a unique key for a request based on method, URL, and parameters
   */
  generateKey(method: string, url: string, params?: any): string {
    const paramsString = params ? new URLSearchParams(params).toString() : '';
    return `${method.toUpperCase()}:${url}${paramsString ? `?${paramsString}` : ''}`;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get the number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Check if a specific request is pending
   */
  isPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }
}

// Export singleton instance
export const requestDeduplication = new RequestDeduplicationService();
export default requestDeduplication;
