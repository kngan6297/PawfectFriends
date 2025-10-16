import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { analyticsService, SystemAnalytics, ShelterAnalytics, UserAnalytics, AnalyticsFilters } from '@/services/analytics.service';

export interface UseAnalyticsOptions {
    autoFetch?: boolean;
    refetchInterval?: number;
    debounceMs?: number;
    onError?: (error: Error) => void;
}

export interface UseSystemAnalyticsReturn {
    data: SystemAnalytics | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    exportData: (format?: 'json' | 'csv') => Promise<void>;
}

export interface UseShelterAnalyticsReturn {
    data: ShelterAnalytics | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    exportData: (format?: 'json' | 'csv') => Promise<void>;
}

export interface UseUserAnalyticsReturn {
    data: UserAnalytics | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    exportData: (format?: 'json' | 'csv') => Promise<void>;
}

/**
 * Hook for fetching system-wide analytics data
 */
export const useSystemAnalytics = (
    filters?: AnalyticsFilters,
    options: UseAnalyticsOptions = {}
): UseSystemAnalyticsReturn => {
    const [data, setData] = useState<SystemAnalytics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const loadingRef = useRef(false);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchData = useCallback(async () => {
        // Prevent multiple simultaneous calls using ref
        if (loadingRef.current) return;

        try {
            loadingRef.current = true;
            setLoading(true);
            setError(null);
            const result = await analyticsService.getSystemAnalytics(filters);
            setData(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch system analytics';
            setError(errorMessage);
            options.onError?.(err instanceof Error ? err : new Error(errorMessage));
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [filters, options.onError]);

    const debouncedFetchData = useCallback(() => {
        // Clear existing timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Set new timeout
        debounceTimeoutRef.current = setTimeout(() => {
            fetchData();
        }, options.debounceMs || 300);
    }, [fetchData, options.debounceMs]);

    const exportData = useCallback(async (format: 'json' | 'csv' = 'json') => {
        if (!data) return;
        await analyticsService.exportAnalytics(data, format);
    }, [data]);

    useEffect(() => {
        if (options.autoFetch !== false) {
            debouncedFetchData();
        }

        // Cleanup timeout on unmount
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [debouncedFetchData, options.autoFetch]);

    useEffect(() => {
        if (options.refetchInterval && options.refetchInterval > 0) {
            const interval = setInterval(fetchData, options.refetchInterval);
            return () => clearInterval(interval);
        }
    }, [fetchData, options.refetchInterval]);

    return {
        data,
        loading,
        error,
        refetch: debouncedFetchData,
        exportData,
    };
};

/**
 * Hook for fetching shelter-specific analytics data
 */
export const useShelterAnalytics = (
    shelterId: string,
    filters?: AnalyticsFilters,
    options: UseAnalyticsOptions = {}
): UseShelterAnalyticsReturn => {
    const [data, setData] = useState<ShelterAnalytics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const loadingRef = useRef(false);

    const fetchData = useCallback(async () => {
        if (!shelterId) return;

        // Prevent multiple simultaneous calls using ref
        if (loadingRef.current) return;

        try {
            loadingRef.current = true;
            setLoading(true);
            setError(null);
            const result = await analyticsService.getShelterAnalytics(shelterId, filters);
            setData(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch shelter analytics';
            setError(errorMessage);
            options.onError?.(err instanceof Error ? err : new Error(errorMessage));
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [shelterId, filters, options.onError]);

    const exportData = useCallback(async (format: 'json' | 'csv' = 'json') => {
        if (!data) return;
        await analyticsService.exportAnalytics(data, format);
    }, [data]);

    useEffect(() => {
        if (options.autoFetch !== false && shelterId) {
            fetchData();
        }
    }, [fetchData, options.autoFetch, shelterId]);

    useEffect(() => {
        if (options.refetchInterval && options.refetchInterval > 0) {
            const interval = setInterval(fetchData, options.refetchInterval);
            return () => clearInterval(interval);
        }
    }, [fetchData, options.refetchInterval]);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
        exportData,
    };
};

/**
 * Hook for fetching user-specific analytics data
 */
export const useUserAnalytics = (
    userId: string,
    filters?: AnalyticsFilters,
    options: UseAnalyticsOptions = {}
): UseUserAnalyticsReturn => {
    const [data, setData] = useState<UserAnalytics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const loadingRef = useRef(false);

    const fetchData = useCallback(async () => {
        if (!userId) return;

        // Prevent multiple simultaneous calls using ref
        if (loadingRef.current) return;

        try {
            loadingRef.current = true;
            setLoading(true);
            setError(null);
            const result = await analyticsService.getUserAnalytics(userId, filters);
            setData(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user analytics';
            setError(errorMessage);
            options.onError?.(err instanceof Error ? err : new Error(errorMessage));
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [userId, filters, options.onError]);

    const exportData = useCallback(async (format: 'json' | 'csv' = 'json') => {
        if (!data) return;
        await analyticsService.exportAnalytics(data, format);
    }, [data]);

    useEffect(() => {
        if (options.autoFetch !== false && userId) {
            fetchData();
        }
    }, [fetchData, options.autoFetch, userId]);

    useEffect(() => {
        if (options.refetchInterval && options.refetchInterval > 0) {
            const interval = setInterval(fetchData, options.refetchInterval);
            return () => clearInterval(interval);
        }
    }, [fetchData, options.refetchInterval]);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
        exportData,
    };
};

/**
 * Hook for comparative analytics between periods
 */
export const useComparativeAnalytics = (
    currentPeriod: { period: '7d' | '30d' | '90d' | '1y' },
    previousPeriod: { period: '7d' | '30d' | '90d' | '1y' },
    type: 'system' | 'shelter' | 'user' = 'system',
    entityId?: string
) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await analyticsService.getComparativeAnalytics(
                currentPeriod,
                previousPeriod,
                type,
                entityId
            );
            setData(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch comparative analytics';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [currentPeriod, previousPeriod, type, entityId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
    };
};

/**
 * Hook for managing analytics filters and state
 */
export const useAnalyticsFilters = (initialFilters?: AnalyticsFilters) => {
    const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters || {});
    const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

    const updateFilters = useCallback((newFilters: Partial<AnalyticsFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    const updatePeriod = useCallback((newPeriod: '7d' | '30d' | '90d' | '1y') => {
        setPeriod(newPeriod);
        setFilters(prev => ({
            ...prev,
            period: { period: newPeriod }
        }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters(initialFilters || {});
        setPeriod('30d');
    }, [initialFilters]);

    const stableFilters = useMemo(() => {
        const currentFilters = { ...filters };
        if (period) {
            currentFilters.period = { period };
        }
        return currentFilters;
    }, [filters, period]);

    return {
        filters: stableFilters,
        period,
        updateFilters,
        updatePeriod,
        resetFilters,
    };
};

/**
 * Hook for analytics data caching and optimization
 */
export const useAnalyticsCache = () => {
    const [cache, setCache] = useState<Map<string, { data: any; timestamp: number }>>(new Map());
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    const getCachedData = useCallback((key: string) => {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }, [cache]);

    const setCachedData = useCallback((key: string, data: any) => {
        setCache(prev => new Map(prev).set(key, { data, timestamp: Date.now() }));
    }, []);

    const clearCache = useCallback(() => {
        setCache(new Map());
    }, []);

    const clearExpiredCache = useCallback(() => {
        const now = Date.now();
        setCache(prev => {
            const newCache = new Map();
            prev.forEach((value, key) => {
                if (now - value.timestamp < CACHE_DURATION) {
                    newCache.set(key, value);
                }
            });
            return newCache;
        });
    }, []);

    return {
        getCachedData,
        setCachedData,
        clearCache,
        clearExpiredCache,
    };
};
