import { apiService } from './apiService';
import { ApiResponse } from '@/types';
import { apiEndpoints } from '@/constants';

export interface Shelter {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    website?: string;
    bio?: string;
    location?: {
        city?: string;
        state?: string;
        country?: string;
        address?: string;
    };
    photos?: Array<{
        url: string;
        caption?: string;
    }>;
    rating?: number;
    profileViews?: number;
    createdAt: string;
    updatedAt: string;
}

export interface ShelterStats {
    petStats: {
        total: number;
        byStatus: Record<string, { count: number; avgViews: number }>;
        topPets: Array<{
            _id: string;
            name: string;
            type: string;
            breed: string;
            age: string;
            views: number;
            status: string;
        }>;
        monthlyStats: Array<{
            _id: {
                year: number;
                month: number;
                status: string;
            };
            count: number;
        }>;
    };
    adoptionStats: {
        byStatus: Record<string, { count: number; avgProcessingTime: number }>;
        successRate: string;
        monthlyAdoptions: Array<{
            _id: {
                year: number;
                month: number;
            };
            count: number;
        }>;
        avgProcessingTime: number;
    };
    reviewStats: {
        total: number;
        avgRating: number;
        ratingBreakdown: Array<{
            _id: number;
            count: number;
        }>;
        recentReviews: Array<{
            _id: string;
            rating: number;
            comment: string;
            createdAt: string;
            user: {
                _id: string;
                name: string;
                avatar?: string;
            };
            adoption?: {
                pet: {
                    _id: string;
                    name: string;
                    photos: Array<{ url: string }>;
                    type: string;
                    breed: string;
                    age: string;
                };
            };
        }>;
    };
    recentActivity: {
        recentPets: Array<{
            _id: string;
            name: string;
            type: string;
            breed: string;
            status: string;
            createdAt: string;
        }>;
        recentRequests: Array<{
            _id: string;
            status: string;
            applicationDate: string;
            user: {
                _id: string;
                name: string;
            };
            pet: {
                _id: string;
                name: string;
            };
        }>;
        recentReviews: Array<{
            _id: string;
            rating: number;
            comment: string;
            createdAt: string;
            user: {
                _id: string;
                name: string;
            };
        }>;
    };
}

export const shelterService = {
    async getShelterById(id: string): Promise<ApiResponse<Shelter>> {
        return apiService.get(`/api/shelters/${id}`);
    },

    async getAllShelters(): Promise<ApiResponse<Shelter[]>> {
        return apiService.get('/api/shelters');
    },

    async searchShelters(params?: {
        query?: string;
        location?: string;
        type?: string;
    }): Promise<ApiResponse<Shelter[]>> {
        return apiService.get('/api/shelters/search', params);
    },

    async getShelterStats(shelterId: string): Promise<ApiResponse<ShelterStats>> {
        return apiService.get(`/api/shelters/${shelterId}/stats`);
    },

    async incrementProfileViews(shelterId: string): Promise<ApiResponse<{ profileViews: number; message: string }>> {
        return apiService.post(`/api/shelters/${shelterId}/views`);
    },

    async getShelterAnalytics(shelterId: string, period: string = '30d'): Promise<ApiResponse<any>> {
        return apiService.get(`/api/shelters/${shelterId}/analytics`, { period });
    },

    async getShelterDashboard(shelterId: string): Promise<ApiResponse<any>> {
        return apiService.get(`/api/shelters/${shelterId}/dashboard`);
    },
};
