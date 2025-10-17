import { apiService } from './apiService';
import { Pet, ApiResponse, PaginatedResponse } from '@/types';
import { apiEndpoints } from '@/constants';

export const petService = {
    async getPets(params?: {
        page?: number;
        limit?: number;
        type?: string;
        breed?: string;
        age?: string;
        gender?: string;
        size?: string;
        location?: string;
        search?: string;
    }): Promise<PaginatedResponse<Pet>> {
        const response = await apiService.get(apiEndpoints.pets.list, params);
        return response.data;
    },

    async getById(id: string): Promise<ApiResponse<Pet>> {
        return apiService.get(apiEndpoints.pets.byId(id));
    },

    async getBySlug(slug: string): Promise<ApiResponse<Pet>> {
        return apiService.get(apiEndpoints.pets.bySlug(slug));
    },

    async searchPets(query: string, filters?: any): Promise<ApiResponse<Pet[]>> {
        const response = await apiService.get(apiEndpoints.pets.search, { query, ...filters });
        // Transform the response to match expected structure
        // Backend returns { data: { pets: [...], pagination: {...} } }
        // Frontend expects { data: [...] }
        return {
            ...response,
            data: response.data?.pets || response.data || []
        };
    },

    async getLatestPets(limit?: number): Promise<ApiResponse<Pet[]>> {
        return apiService.get(apiEndpoints.pets.latest, { limit });
    },

    async getFavorites(): Promise<ApiResponse<Pet[]>> {
        return apiService.get(apiEndpoints.users.favorites);
    },

    async toggleFavorite(petId: string): Promise<ApiResponse<{ isFavorite: boolean }>> {
        return apiService.patch(`${apiEndpoints.users.favorites}/${petId}/toggle`);
    },

    async addViewedPet(petId: string): Promise<ApiResponse<void>> {
        return apiService.post(`${apiEndpoints.users.viewedPets}/${petId}`);
    },

    async getViewedPets(): Promise<ApiResponse<Pet[]>> {
        return apiService.get(apiEndpoints.users.viewedPets);
    },

    async getSimilarPets(petId: string): Promise<ApiResponse<Pet[]>> {
        return apiService.get(`/api/pets/${petId}/similar`);
    },
};
