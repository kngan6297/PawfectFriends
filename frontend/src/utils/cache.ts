import { useState, useCallback, useEffect } from "react";

interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

class Cache {
    private static instance: Cache;
    private cache: Map<string, CacheItem<any>>;
    private cleanupInterval: NodeJS.Timeout;

    private constructor() {
        this.cache = new Map();
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
    }

    public static getInstance(): Cache {
        if (!Cache.instance) {
            Cache.instance = new Cache();
        }
        return Cache.instance;
    }

    public set<T>(key: string, data: T, ttl: number = 3600000): void {
        const timestamp = Date.now();
        const expiresAt = timestamp + ttl;

        this.cache.set(key, {
            data,
            timestamp,
            expiresAt,
        });
    }

    public get<T>(key: string): T | null {
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return item.data as T;
    }

    public has(key: string): boolean {
        return this.get(key) !== null;
    }

    public delete(key: string): void {
        this.cache.delete(key);
    }

    public clear(): void {
        this.cache.clear();
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    public destroy(): void {
        clearInterval(this.cleanupInterval);
        this.cache.clear();
    }
}

export const cache = Cache.getInstance();

// Cache hooks
export function useCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 3600000
): {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
} {
    const [data, setData] = useState<T | null>(() => cache.get<T>(key));
    const [loading, setLoading] = useState(!data);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await fetchFn();
            cache.set(key, result, ttl);
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("An error occurred"));
        } finally {
            setLoading(false);
        }
    }, [key, fetchFn, ttl]);

    useEffect(() => {
        if (!data) {
            fetchData();
        }
    }, [data, fetchData]);

    return { data, loading, error, refetch: fetchData };
}

// Cache decorator for API calls
export function withCache<T>(
    ttl: number = 3600000
): MethodDecorator {
    return function (
        _: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const cacheKey = `${String(propertyKey)}:${JSON.stringify(args)}`;
            const cachedData = cache.get<T>(cacheKey);

            if (cachedData) {
                return cachedData;
            }

            const result = await originalMethod.apply(this, args);
            cache.set(cacheKey, result, ttl);
            return result;
        };

        return descriptor;
    };
} 