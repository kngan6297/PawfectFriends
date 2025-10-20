import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, petApi, notificationApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

// Query keys
export const queryKeys = {
    user: {
        profile: ['user', 'profile'] as const,
        favorites: ['user', 'favorites'] as const,
    },
    pets: {
        latest: (limit?: number) => ['pets', 'latest', limit] as const,
        list: (params?: any) => ['pets', 'list', params] as const,
    },
    notifications: {
        list: (params?: any) => ['notifications', 'list', params] as const,
        unreadCount: ['notifications', 'unreadCount'] as const,
    },
};

// User profile query
export const useUserProfile = () => {
    const { user, isAuthenticated } = useAuth();

    return useQuery({
        queryKey: queryKeys.user.profile,
        queryFn: () => userApi.getProfile(),
        enabled: isAuthenticated && !user, // Only fetch if authenticated but no user data
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
    });
};

// User favorites query
export const useUserFavorites = () => {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: queryKeys.user.favorites,
        queryFn: () => userApi.getFavorites(),
        enabled: isAuthenticated,
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });
};

// Latest pets query
export const useLatestPets = (limit?: number) => {
    return useQuery({
        queryKey: queryKeys.pets.latest(limit),
        queryFn: () => petApi.getLatestPets(limit),
        staleTime: 3 * 60 * 1000, // 3 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
    });
};

// Notifications query
export const useNotificationsQuery = (params?: any) => {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: queryKeys.notifications.list(params),
        queryFn: () => notificationApi.getNotifications(params),
        enabled: isAuthenticated,
        staleTime: 1 * 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });
};

// Unread notifications count query
export const useUnreadNotificationsCount = () => {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: queryKeys.notifications.unreadCount,
        queryFn: () => notificationApi.getUnreadCount(),
        enabled: isAuthenticated,
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 2 * 60 * 1000, // 2 minutes
        retry: 2,
        refetchInterval: 60 * 1000, // Refetch every minute
    });
};

// Mutations
export const useToggleFavoriteMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (petId: string) => userApi.toggleFavorite(petId),
        onSuccess: () => {
            // Invalidate favorites query to refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.user.favorites });
        },
    });
};

export const useMarkNotificationReadMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),
        onSuccess: () => {
            // Invalidate both notifications queries
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
        },
    });
};
