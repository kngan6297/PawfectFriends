import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { User } from '@/types';

export const useUserProfile = () => {
    return useQuery({
        queryKey: ['user', 'profile'],
        queryFn: () => userService.getProfile(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userData: Partial<User>) => userService.updateProfile(userData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
        },
    });
};

export const useUpdatePreferences = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (preferences: any) => userService.updatePreferences(preferences),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
        },
    });
};

export const useUpdateLocation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (location: {
            latitude: number;
            longitude: number;
            address?: string;
            city?: string;
            state?: string;
            zipCode?: string;
        }) => userService.updateLocation(location),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
        },
    });
};

export const useUploadAvatar = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (imageUri: string) => userService.uploadAvatar(imageUri),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
        },
    });
};

export const useDeleteAvatar = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => userService.deleteAvatar(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
        },
    });
};

export const useUpdateAddress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (address: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
        }) => userService.updateAddress(address),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
        },
    });
};

export const useUpdateSecuritySettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (settings: {
            twoFactorEnabled?: boolean;
            emailNotifications?: boolean;
            smsNotifications?: boolean;
        }) => userService.updateSecuritySettings(settings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
        },
    });
};
