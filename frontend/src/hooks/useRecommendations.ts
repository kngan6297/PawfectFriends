import { useState, useEffect } from 'react';
import { recommendationService } from '@/services/recommendation.service';
import { Pet } from '@/types/pet';
import { useAuth } from './useAuth';

interface UseRecommendationsReturn {
    recommendations: Pet[];
    loading: boolean;
    error: Error | null;
    refreshRecommendations: () => Promise<void>;
    clearCache: () => Promise<void>;
}

export const useRecommendations = (): UseRecommendationsReturn => {
    const [recommendations, setRecommendations] = useState<Pet[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const { isAuthenticated } = useAuth();

    const fetchRecommendations = async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await recommendationService.getPetRecommendations();
            setRecommendations(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
        } finally {
            setLoading(false);
        }
    };

    const clearCache = async () => {
        try {
            setLoading(true);
            setError(null);
            await recommendationService.clearRecommendationCache();
            await fetchRecommendations(); // Refresh recommendations after clearing cache
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to clear cache'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, [isAuthenticated]);

    return {
        recommendations,
        loading,
        error,
        refreshRecommendations: fetchRecommendations,
        clearCache
    };
}; 