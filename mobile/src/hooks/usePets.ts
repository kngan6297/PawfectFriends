import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { petService } from '@/services/petService';
import { Pet } from '@/types';

export const usePets = (params?: any) => {
    return useQuery({
        queryKey: ['pets', params],
        queryFn: () => petService.getPets(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const usePet = (id: string) => {
    return useQuery({
        queryKey: ['pet', id],
        queryFn: () => petService.getById(id),
        enabled: !!id,
    });
};

export const usePetBySlug = (slug: string) => {
    return useQuery({
        queryKey: ['pet', 'slug', slug],
        queryFn: () => petService.getBySlug(slug),
        enabled: !!slug,
    });
};

export const useLatestPets = (limit?: number) => {
    return useQuery({
        queryKey: ['pets', 'latest', limit],
        queryFn: () => petService.getLatestPets(limit),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

export const useSearchPets = (query: string, filters?: any) => {
    const hasSearchQuery = query && query.length > 2;
    const hasFilters = filters && Object.values(filters).some((filter: any) => filter !== "");

    return useQuery({
        queryKey: ['pets', 'search', query, filters],
        queryFn: () => petService.searchPets(query, filters),
        enabled: hasSearchQuery || hasFilters || (!query && !filters), // Enable for search, filters, or when showing all pets
        staleTime: 1 * 60 * 1000, // 1 minute
    });
};

export const useFavorites = () => {
    return useQuery({
        queryKey: ['pets', 'favorites'],
        queryFn: () => petService.getFavorites(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

export const useToggleFavorite = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (petId: string) => petService.toggleFavorite(petId),
        onSuccess: (data, petId) => {
            // Update favorites cache
            queryClient.invalidateQueries({ queryKey: ['pets', 'favorites'] });

            // Update individual pet cache
            queryClient.setQueryData(['pet', petId], (oldData: any) => {
                if (oldData?.data) {
                    return {
                        ...oldData,
                        data: {
                            ...oldData.data,
                            isFavorite: data.data?.isFavorite ?? !oldData.data.isFavorite,
                        },
                    };
                }
                return oldData;
            });
        },
    });
};

export const useViewedPets = () => {
    return useQuery({
        queryKey: ['pets', 'viewed'],
        queryFn: () => petService.getViewedPets(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useAddViewedPet = () => {
    return useMutation({
        mutationFn: (petId: string) => petService.addViewedPet(petId),
    });
};

export const useSimilarPets = (petId: string) => {
    return useQuery({
        queryKey: ['pets', 'similar', petId],
        queryFn: () => petService.getSimilarPets(petId),
        enabled: !!petId,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};
