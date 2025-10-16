import { create } from 'zustand';
import { Pet } from '@/types';
import { petService } from '@/services/petService';

interface PetState {
    favorites: Pet[];
    favoriteIds: string[];
    viewedPets: Pet[];
    isLoading: boolean;
    error: string | null;
}

interface PetActions {
    fetchFavorites: () => Promise<void>;
    toggleFavorite: (petId: string) => Promise<boolean>;
    addToViewed: (pet: Pet) => void;
    clearViewed: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
}

export const usePetStore = create<PetState & PetActions>((set, get) => ({
    // State
    favorites: [],
    favoriteIds: [],
    viewedPets: [],
    isLoading: false,
    error: null,

    // Actions
    fetchFavorites: async () => {
        set({ isLoading: true, error: null });

        try {
            const response = await petService.getFavorites();
            if (response.success && response.data) {
                set({
                    favorites: response.data,
                    favoriteIds: response.data.map((pet: Pet) => pet.id),
                    isLoading: false,
                });
            } else {
                set({
                    isLoading: false,
                    error: response.message || 'Failed to fetch favorites',
                });
            }
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to fetch favorites',
            });
        }
    },

    toggleFavorite: async (petId: string) => {
        try {
            const response = await petService.toggleFavorite(petId);

            if (response.success) {
                const { favorites, favoriteIds } = get();
                const isCurrentlyFavorite = favoriteIds.includes(petId);

                if (isCurrentlyFavorite) {
                    // Remove from favorites
                    set({
                        favorites: favorites.filter(pet => pet.id !== petId),
                        favoriteIds: favoriteIds.filter(id => id !== petId),
                    });
                } else {
                    // Add to favorites - we'll need to fetch the pet details
                    try {
                        const petResponse = await petService.getById(petId);
                        if (petResponse.success && petResponse.data) {
                            set({
                                favorites: [...favorites, petResponse.data],
                                favoriteIds: [...favoriteIds, petId],
                            });
                        }
                    } catch (error) {
                        console.error('Failed to fetch pet details:', error);
                    }
                }

                return !isCurrentlyFavorite;
            }

            return false;
        } catch (error: any) {
            set({ error: error.message || 'Failed to toggle favorite' });
            return false;
        }
    },

    addToViewed: (pet: Pet) => {
        const { viewedPets } = get();
        const existingIndex = viewedPets.findIndex(p => p.id === pet.id);

        if (existingIndex >= 0) {
            // Move to front if already viewed
            const updated = [...viewedPets];
            updated.splice(existingIndex, 1);
            set({ viewedPets: [pet, ...updated] });
        } else {
            // Add to front
            set({ viewedPets: [pet, ...viewedPets.slice(0, 49)] }); // Keep last 50
        }

        // Also track on server
        petService.addViewedPet(pet.id).catch(console.error);
    },

    clearViewed: () => {
        set({ viewedPets: [] });
    },

    setLoading: (loading: boolean) => {
        set({ isLoading: loading });
    },

    setError: (error: string | null) => {
        set({ error });
    },

    clearError: () => {
        set({ error: null });
    },
}));
