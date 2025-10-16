import { apiService } from './apiService';
import { User, ApiResponse } from '@/types';
import { apiEndpoints } from '@/constants';

export const userService = {
    async getProfile(): Promise<ApiResponse<User>> {
        return apiService.get(apiEndpoints.users.profile);
    },

    async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
        return apiService.put(apiEndpoints.users.profile, userData);
    },

    async updatePreferences(preferences: any): Promise<ApiResponse<User>> {
        return apiService.put(apiEndpoints.users.preferences, preferences);
    },

    async updateLocation(location: {
        latitude: number;
        longitude: number;
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
    }): Promise<ApiResponse<User>> {
        return apiService.put('/api/users/location', location);
    },

    async uploadAvatar(imageUri: string): Promise<ApiResponse<{ avatar: string }>> {
        const formData = new FormData();
        formData.append('avatar', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'avatar.jpg',
        } as any);

        return apiService.post(apiEndpoints.users.avatar, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    async deleteAvatar(): Promise<ApiResponse<void>> {
        return apiService.delete(apiEndpoints.users.avatar);
    },

    async updateAddress(address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    }): Promise<ApiResponse<User>> {
        return apiService.put('/api/users/profile/address', address);
    },

    async updateSecuritySettings(settings: {
        twoFactorEnabled?: boolean;
        emailNotifications?: boolean;
        smsNotifications?: boolean;
    }): Promise<ApiResponse<User>> {
        return apiService.put('/api/users/profile/security', settings);
    },
};
