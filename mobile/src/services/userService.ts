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
        try {
            console.log('Uploading avatar with URI:', imageUri.substring(0, 50) + '...');

            // Check if it's a base64 data URI
            if (imageUri.startsWith('data:image/')) {
                console.log('Processing base64 data URI');

                // Extract base64 data from data URI
                const base64Data = imageUri.split(',')[1];
                const mimeType = imageUri.split(',')[0].split(':')[1].split(';')[0];

                // Convert base64 to blob
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mimeType });

                // Create File object
                const file = new File([blob], 'avatar.jpg', { type: mimeType });

                const formData = new FormData();
                formData.append('avatar', file);

                console.log('Created FormData with file:', file.name, file.type, file.size);

                return apiService.post(apiEndpoints.users.avatar, formData);
            } else {
                // For web environment with regular URLs
                if (typeof window !== 'undefined') {
                    console.log('Processing regular image URL');
                    const response = await fetch(imageUri);
                    const blob = await response.blob();
                    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });

                    const formData = new FormData();
                    formData.append('avatar', file);

                    return apiService.post(apiEndpoints.users.avatar, formData);
                } else {
                    // Mobile environment - use the original approach
                    console.log('Processing mobile image URI');
                    const formData = new FormData();
                    formData.append('avatar', {
                        uri: imageUri,
                        type: 'image/jpeg',
                        name: 'avatar.jpg',
                    } as any);

                    return apiService.post(apiEndpoints.users.avatar, formData);
                }
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            return {
                success: false,
                message: 'Failed to upload avatar',
                error: error,
            };
        }
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
