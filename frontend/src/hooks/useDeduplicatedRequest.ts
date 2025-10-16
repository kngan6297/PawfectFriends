import { useCallback, useRef } from 'react';
import { requestDeduplication } from '../services/requestDeduplication';

/**
 * Custom hook for making deduplicated API requests
 * Prevents multiple simultaneous calls to the same endpoint
 */
export const useDeduplicatedRequest = () => {
  const requestIdRef = useRef<string>('');

  /**
   * Make a deduplicated request
   */
  const makeRequest = useCallback(
    async <T>(
      method: string,
      url: string,
      requestFn: () => Promise<T>,
      params?: any
    ): Promise<T> => {
      const key = requestDeduplication.generateKey(method, url, params);
      requestIdRef.current = key;
      
      return requestDeduplication.execute(key, requestFn);
    },
    []
  );

  /**
   * Make a GET request with deduplication
   */
  const get = useCallback(
    async <T>(url: string, params?: any): Promise<T> => {
      return makeRequest('GET', url, async () => {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
      }, params);
    },
    [makeRequest]
  );

  /**
   * Make a POST request with deduplication
   */
  const post = useCallback(
    async <T>(url: string, data?: any, params?: any): Promise<T> => {
      return makeRequest('POST', url, async () => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: data ? JSON.stringify(data) : undefined,
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
      }, params);
    },
    [makeRequest]
  );

  /**
   * Make a PUT request with deduplication
   */
  const put = useCallback(
    async <T>(url: string, data?: any, params?: any): Promise<T> => {
      return makeRequest('PUT', url, async () => {
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: data ? JSON.stringify(data) : undefined,
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
      }, params);
    },
    [makeRequest]
  );

  /**
   * Make a DELETE request with deduplication
   */
  const del = useCallback(
    async <T>(url: string, params?: any): Promise<T> => {
      return makeRequest('DELETE', url, async () => {
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
      }, params);
    },
    [makeRequest]
  );

  /**
   * Check if the current request is pending
   */
  const isPending = useCallback((url: string, params?: any): boolean => {
    const key = requestDeduplication.generateKey('GET', url, params);
    return requestDeduplication.isPending(key);
  }, []);

  /**
   * Get the current request ID
   */
  const getCurrentRequestId = useCallback((): string => {
    return requestIdRef.current;
  }, []);

  return {
    get,
    post,
    put,
    delete: del,
    isPending,
    getCurrentRequestId,
  };
};
