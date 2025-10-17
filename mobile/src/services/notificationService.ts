import { apiService } from './apiService';
import { ApiResponse } from '@/types';
import { apiEndpoints } from '@/constants';

export interface Notification {
    _id: string;
    recipient: string;
    sender?: {
        _id: string;
        name: string;
        avatar?: string;
    };
    type: 'adoption_request' | 'adoption_status_change' | 'new_message' | 'pet_status_change' | 'review_received' | 'system_alert' | 'reminder' | 'meeting_scheduled' | 'contract_sent' | 'information_request' | 'information_submitted' | 'information_reviewed' | 'information_reminder' | 'meeting_reminder' | 'follow_up_reminder';
    title: string;
    message: string;
    data?: {
        priority?: 'low' | 'medium' | 'high' | 'urgent';
        actionUrl?: string;
        actionText?: string;
        [key: string]: any;
    };
    isRead: boolean;
    readAt?: string;
    isArchived: boolean;
    sentVia: Array<{
        type: 'in_app' | 'email' | 'push';
        status: 'sent' | 'failed' | 'pending';
        sentAt?: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationSettings {
    email: {
        adoption_request: boolean;
        adoption_status_change: boolean;
        new_message: boolean;
        pet_status_change: boolean;
        review_received: boolean;
        system_alert: boolean;
        reminder: boolean;
    };
    push: {
        adoption_request: boolean;
        adoption_status_change: boolean;
        new_message: boolean;
        pet_status_change: boolean;
        review_received: boolean;
        system_alert: boolean;
        reminder: boolean;
    };
    in_app: {
        adoption_request: boolean;
        adoption_status_change: boolean;
        new_message: boolean;
        pet_status_change: boolean;
        review_received: boolean;
        system_alert: boolean;
        reminder: boolean;
    };
}

export interface NotificationListResponse {
    notifications: Notification[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export const notificationService = {
    /**
     * Get user notifications with pagination and filtering
     */
    async getNotifications(params?: {
        page?: number;
        limit?: number;
        type?: string;
        isRead?: boolean;
    }): Promise<ApiResponse<NotificationListResponse>> {
        return apiService.get(apiEndpoints.notifications.list, params);
    },

    /**
     * Get unread notification count
     */
    async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
        return apiService.get(apiEndpoints.notifications.unreadCount);
    },

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
        return apiService.patch(apiEndpoints.notifications.markAsRead(notificationId));
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<ApiResponse<{ message: string }>> {
        return apiService.patch(apiEndpoints.notifications.markAllRead);
    },

    /**
     * Delete notification
     */
    async deleteNotification(notificationId: string): Promise<ApiResponse<{ message: string }>> {
        return apiService.delete(apiEndpoints.notifications.delete(notificationId));
    },

    /**
     * Archive notification
     */
    async archiveNotification(notificationId: string): Promise<ApiResponse<Notification>> {
        return apiService.patch(apiEndpoints.notifications.archive(notificationId));
    },

    /**
     * Get notification settings
     */
    async getSettings(): Promise<ApiResponse<NotificationSettings>> {
        return apiService.get(apiEndpoints.notifications.settings);
    },

    /**
     * Update notification settings
     */
    async updateSettings(settings: Partial<NotificationSettings>): Promise<ApiResponse<{ message: string }>> {
        return apiService.put(apiEndpoints.notifications.settings, settings);
    },

    /**
     * Test notification (for development/testing)
     */
    async testNotification(data?: {
        type?: string;
        title?: string;
        message?: string;
    }): Promise<ApiResponse<Notification>> {
        return apiService.post(apiEndpoints.notifications.test, data);
    },

    /**
     * Test real-time notification (for development/testing)
     */
    async testRealTimeNotification(data?: {
        title?: string;
        message?: string;
        broadcast?: boolean;
    }): Promise<ApiResponse<{
        notification: Notification;
        activeConnections: number;
        connectedUsers: string[];
    }>> {
        return apiService.post(apiEndpoints.notifications.testRealtime, data);
    },
};
