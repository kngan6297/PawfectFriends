import { getIntegrationConfig } from '../config/integration';
import { authService } from './auth.service';

export enum AdoptionStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    ON_HOLD = 'on_hold'
}

export enum NotificationType {
    ADOPTION_SUBMITTED = 'adoption_submitted',
    ADOPTION_APPROVED = 'adoption_approved',
    ADOPTION_REJECTED = 'adoption_rejected',
    ADOPTION_IN_PROGRESS = 'adoption_in_progress',
    ADOPTION_COMPLETED = 'adoption_completed',
    ADOPTION_CANCELLED = 'adoption_cancelled',
    ADOPTION_ON_HOLD = 'adoption_on_hold',
    DOCUMENT_REQUESTED = 'document_requested',
    DOCUMENT_SUBMITTED = 'document_submitted',
    MEETING_SCHEDULED = 'meeting_scheduled',
    MEETING_CANCELLED = 'meeting_cancelled',
    PET_STATUS_CHANGED = 'pet_status_changed',
    MEDICAL_UPDATE = 'medical_update',
    BEHAVIOR_UPDATE = 'behavior_update',
    ADOPTION_REMINDER = 'adoption_reminder',
    FOLLOW_UP_REQUIRED = 'follow_up_required'
}

export enum NotificationPriority {
    LOW = 'low',
    NORMAL = 'normal',
    HIGH = 'high',
    URGENT = 'urgent'
}

export enum NotificationChannel {
    IN_APP = 'in_app',
    EMAIL = 'email',
    SMS = 'sms',
    PUSH = 'push'
}

export interface AdoptionNotification {
    id: string;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    adoptionId: string;
    petId: string;
    petName: string;
    recipientId: string;
    recipientRole: string;
    senderId: string;
    senderRole: string;
    channels: NotificationChannel[];
    metadata?: {
        status?: AdoptionStatus;
        dueDate?: string;
        location?: string;
        documents?: string[];
        meetingTime?: string;
        urgency?: string;
        notes?: string;
    };
    isRead: boolean;
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
    expiresAt?: string;
}

export interface CreateNotificationRequest {
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    adoptionId: string;
    petId: string;
    petName: string;
    recipientIds: string[];
    recipientRoles: string[];
    senderId: string;
    senderRole: string;
    channels: NotificationChannel[];
    metadata?: any;
    expiresAt?: string;
}

export interface NotificationFilters {
    type?: NotificationType;
    priority?: NotificationPriority;
    adoptionId?: string;
    petId?: string;
    recipientId?: string;
    isRead?: boolean;
    isArchived?: boolean;
    dateRange?: {
        start: string;
        end: string;
    };
}

export interface NotificationPreferences {
    userId: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    inAppNotifications: boolean;
    adoptionUpdates: boolean;
    medicalUpdates: boolean;
    meetingReminders: boolean;
    documentRequests: boolean;
    quietHours: {
        enabled: boolean;
        start: string; // HH:mm format
        end: string;   // HH:mm format
    };
    preferences: {
        [key in NotificationType]: NotificationChannel[];
    };
}

class AdoptionNotificationService {
    private config = getIntegrationConfig();
    private eventSource: EventSource | null = null;
    private notificationCallbacks: Map<string, (notification: AdoptionNotification) => void> = new Map();

    /**
     * Create a new adoption notification
     */
    async createNotification(data: CreateNotificationRequest): Promise<AdoptionNotification[]> {
        try {
            const token = authService.getAuthToken();
            if (!token) return [];

            const response = await fetch(`${this.config.apiBaseUrl}/notifications`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error creating adoption notification:', error);
            return [];
        }
    }

    /**
     * Get notifications for current user with optional filtering
     */
    async getNotifications(filters: NotificationFilters = {}): Promise<AdoptionNotification[]> {
        try {
            const token = authService.getAuthToken();
            if (!token) return [];

            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (key === 'dateRange') {
                        params.append('startDate', value.start);
                        params.append('endDate', value.end);
                    } else {
                        params.append(key, value.toString());
                    }
                }
            });

            const response = await fetch(`${this.config.apiBaseUrl}/notifications?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(): Promise<number> {
        try {
            const token = authService.getAuthToken();
            if (!token) {
                console.log('No auth token available for notifications');
                return 0;
            }

            const response = await fetch(`${this.config.apiBaseUrl}/notifications/unread-count`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const result = await response.json();
                return result.count || 0;
            }
            return 0;
        } catch (error) {
            console.log('Notifications service unavailable:', (error as Error).message);
            return 0;
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    }

    /**
     * Mark multiple notifications as read
     */
    async markMultipleAsRead(notificationIds: string[]): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/notifications/mark-all-read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notificationIds }),
            });

            return response.ok;
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            return false;
        }
    }

    /**
     * Archive notification
     */
    async archiveNotification(notificationId: string): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/notifications/${notificationId}/archive`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Error archiving notification:', error);
            return false;
        }
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId: string): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Error deleting notification:', error);
            return false;
        }
    }

    /**
     * Get notification preferences for current user
     */
    async getNotificationPreferences(): Promise<NotificationPreferences | null> {
        try {
            const token = authService.getAuthToken();
            if (!token) return null;

            const response = await fetch(`${this.config.apiBaseUrl}/notification-preferences`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
            return null;
        }
    }

    /**
     * Update notification preferences
     */
    async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/notification-preferences`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(preferences),
            });

            return response.ok;
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            return false;
        }
    }

    /**
     * Start real-time notification listening
     */
    startRealTimeNotifications(userId: string): void {
        if (this.eventSource) {
            this.stopRealTimeNotifications();
        }

        try {
            const token = authService.getAuthToken();
            if (!token) {
                console.warn('No auth token available for real-time notifications');
                return;
            }

            // Create EventSource connection to the SSE endpoint
            const url = `${this.config.apiBaseUrl}/notifications/stream`;
            this.eventSource = new EventSource(url, {
                withCredentials: false,
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            } as any);

            // Handle connection open
            this.eventSource.onopen = () => {
                console.log('Real-time notifications connected');
            };

            // Handle incoming messages
            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'notification') {
                        this.handleRealTimeNotification(data.data);
                    } else if (data.type === 'heartbeat') {
                        // Handle heartbeat - connection is alive
                        console.debug('Real-time notification heartbeat received');
                    } else if (data.type === 'connection') {
                        console.log('Real-time notifications connected:', data.message);
                    }
                } catch (error) {
                    console.error('Error parsing real-time notification:', error);
                }
            };

            // Handle connection errors
            this.eventSource.onerror = (error) => {
                console.error('Real-time notification connection error:', error);

                // Attempt to reconnect after 5 seconds
                setTimeout(() => {
                    if (this.eventSource?.readyState === EventSource.CLOSED) {
                        console.log('Attempting to reconnect real-time notifications...');
                        this.startRealTimeNotifications(userId);
                    }
                }, 5000);
            };

        } catch (error) {
            console.error('Error starting real-time notifications:', error);
        }
    }

    /**
     * Stop real-time notification listening
     */
    stopRealTimeNotifications(): void {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    /**
     * Reconnect real-time notifications
     */
    private reconnectRealTimeNotifications(userId: string): void {
        console.log('Reconnecting real-time notifications...');
        this.startRealTimeNotifications(userId);
    }

    /**
     * Handle incoming real-time notification
     */
    private handleRealTimeNotification(notification: AdoptionNotification): void {
        // Trigger registered callbacks
        this.notificationCallbacks.forEach((callback) => {
            try {
                callback(notification);
            } catch (error) {
                console.error('Error in notification callback:', error);
            }
        });

        // Show browser notification if permission granted
        this.showBrowserNotification(notification);
    }

    /**
     * Show browser notification
     */
    private showBrowserNotification(notification: AdoptionNotification): void {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }

        const notificationOptions: NotificationOptions = {
            body: notification.message,
            icon: '/logo.svg',
            badge: '/logo.svg',
            tag: notification.id,
            requireInteraction: notification.priority === NotificationPriority.URGENT,
            data: notification,
        };

        new Notification(notification.title, notificationOptions);
    }

    /**
     * Register callback for real-time notifications
     */
    onNotification(callback: (notification: AdoptionNotification) => void): string {
        const id = `callback_${Date.now()}_${Math.random()}`;
        this.notificationCallbacks.set(id, callback);
        return id;
    }

    /**
     * Unregister callback for real-time notifications
     */
    offNotification(callbackId: string): void {
        this.notificationCallbacks.delete(callbackId);
    }

    /**
     * Request browser notification permission
     */
    async requestNotificationPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('Browser notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            console.warn('Notification permission denied');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    /**
     * Create adoption status change notification
     */
    async notifyAdoptionStatusChange(
        adoptionId: string,
        petId: string,
        petName: string,
        oldStatus: AdoptionStatus,
        newStatus: AdoptionStatus,
        recipientIds: string[],
        notes?: string
    ): Promise<AdoptionNotification[]> {
        const statusMessages = {
            [AdoptionStatus.PENDING]: 'Your adoption application has been submitted and is under review.',
            [AdoptionStatus.APPROVED]: 'Congratulations! Your adoption application has been approved.',
            [AdoptionStatus.REJECTED]: 'Your adoption application has been reviewed but unfortunately not approved.',
            [AdoptionStatus.IN_PROGRESS]: 'Your adoption process is now in progress.',
            [AdoptionStatus.COMPLETED]: 'Your adoption has been completed successfully!',
            [AdoptionStatus.CANCELLED]: 'Your adoption application has been cancelled.',
            [AdoptionStatus.ON_HOLD]: 'Your adoption application has been put on hold.'
        };

        const priority = this.getStatusChangePriority(oldStatus, newStatus);
        const title = `Adoption Status Update: ${petName}`;
        const message = notes || statusMessages[newStatus] || 'Your adoption status has been updated.';

        return this.createNotification({
            type: this.getStatusChangeNotificationType(newStatus),
            priority,
            title,
            message,
            adoptionId,
            petId,
            petName,
            recipientIds,
            recipientRoles: ['adopter'],
            senderId: 'system',
            senderRole: 'system',
            channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
            metadata: {
                status: newStatus,
                oldStatus,
                notes
            }
        });
    }

    /**
     * Create document request notification
     */
    async notifyDocumentRequest(
        adoptionId: string,
        petId: string,
        petName: string,
        recipientId: string,
        documentTypes: string[],
        dueDate?: string,
        notes?: string
    ): Promise<AdoptionNotification[]> {
        const title = `Document Request: ${petName}`;
        const message = `Please submit the following documents: ${documentTypes.join(', ')}${dueDate ? ` by ${dueDate}` : ''}.`;

        return this.createNotification({
            type: NotificationType.DOCUMENT_REQUESTED,
            priority: NotificationPriority.HIGH,
            title,
            message,
            adoptionId,
            petId,
            petName,
            recipientIds: [recipientId],
            recipientRoles: ['adopter'],
            senderId: 'system',
            senderRole: 'system',
            channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
            metadata: {
                documentTypes,
                dueDate,
                notes
            }
        });
    }

    /**
     * Create meeting scheduling notification
     */
    async notifyMeetingScheduled(
        adoptionId: string,
        petId: string,
        petName: string,
        recipientIds: string[],
        meetingTime: string,
        location: string,
        notes?: string
    ): Promise<AdoptionNotification[]> {
        const title = `Meeting Scheduled: ${petName}`;
        const message = `A meeting has been scheduled for ${meetingTime} at ${location}.`;

        return this.createNotification({
            type: NotificationType.MEETING_SCHEDULED,
            priority: NotificationPriority.HIGH,
            title,
            message,
            adoptionId,
            petId,
            petName,
            recipientIds,
            recipientRoles: ['adopter', 'shelter_staff'],
            senderId: 'system',
            senderRole: 'system',
            channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
            metadata: {
                meetingTime,
                location,
                notes
            }
        });
    }

    /**
     * Get priority for status change
     */
    private getStatusChangePriority(oldStatus: AdoptionStatus, newStatus: AdoptionStatus): NotificationPriority {
        if (newStatus === AdoptionStatus.APPROVED || newStatus === AdoptionStatus.COMPLETED) {
            return NotificationPriority.HIGH;
        }
        if (newStatus === AdoptionStatus.REJECTED || newStatus === AdoptionStatus.CANCELLED) {
            return NotificationPriority.HIGH;
        }
        if (newStatus === AdoptionStatus.IN_PROGRESS) {
            return NotificationPriority.NORMAL;
        }
        return NotificationPriority.LOW;
    }

    /**
     * Get notification type for status change
     */
    private getStatusChangeNotificationType(status: AdoptionStatus): NotificationType {
        switch (status) {
            case AdoptionStatus.APPROVED:
                return NotificationType.ADOPTION_APPROVED;
            case AdoptionStatus.REJECTED:
                return NotificationType.ADOPTION_REJECTED;
            case AdoptionStatus.IN_PROGRESS:
                return NotificationType.ADOPTION_IN_PROGRESS;
            case AdoptionStatus.COMPLETED:
                return NotificationType.ADOPTION_COMPLETED;
            case AdoptionStatus.CANCELLED:
                return NotificationType.ADOPTION_CANCELLED;
            case AdoptionStatus.ON_HOLD:
                return NotificationType.ADOPTION_ON_HOLD;
            default:
                return NotificationType.ADOPTION_SUBMITTED;
        }
    }

    /**
     * Get notification type information
     */
    getNotificationTypeInfo(): { value: NotificationType; label: string; icon: string; description: string; priority: NotificationPriority }[] {
        return [
            {
                value: NotificationType.ADOPTION_SUBMITTED,
                label: 'Adoption Submitted',
                icon: '📝',
                description: 'New adoption application submitted',
                priority: NotificationPriority.NORMAL
            },
            {
                value: NotificationType.ADOPTION_APPROVED,
                label: 'Adoption Approved',
                icon: '✅',
                description: 'Adoption application approved',
                priority: NotificationPriority.HIGH
            },
            {
                value: NotificationType.ADOPTION_REJECTED,
                label: 'Adoption Rejected',
                icon: '❌',
                description: 'Adoption application rejected',
                priority: NotificationPriority.HIGH
            },
            {
                value: NotificationType.ADOPTION_IN_PROGRESS,
                label: 'Adoption In Progress',
                icon: '🔄',
                description: 'Adoption process started',
                priority: NotificationPriority.NORMAL
            },
            {
                value: NotificationType.ADOPTION_COMPLETED,
                label: 'Adoption Completed',
                icon: '🎉',
                description: 'Adoption successfully completed',
                priority: NotificationPriority.HIGH
            },
            {
                value: NotificationType.DOCUMENT_REQUESTED,
                label: 'Document Requested',
                icon: '📋',
                description: 'Additional documents required',
                priority: NotificationPriority.HIGH
            },
            {
                value: NotificationType.MEETING_SCHEDULED,
                label: 'Meeting Scheduled',
                icon: '📅',
                description: 'New meeting scheduled',
                priority: NotificationPriority.HIGH
            },
            {
                value: NotificationType.MEDICAL_UPDATE,
                label: 'Medical Update',
                icon: '🏥',
                description: 'Pet medical information updated',
                priority: NotificationPriority.NORMAL
            },
            {
                value: NotificationType.BEHAVIOR_UPDATE,
                label: 'Behavior Update',
                icon: '🐾',
                description: 'Pet behavior information updated',
                priority: NotificationPriority.NORMAL
            }
        ];
    }

    /**
     * Get adoption status information
     */
    getAdoptionStatusInfo(): { value: AdoptionStatus; label: string; icon: string; description: string; color: string }[] {
        return [
            {
                value: AdoptionStatus.PENDING,
                label: 'Pending',
                icon: '⏳',
                description: 'Application submitted, under review',
                color: '#ffa500'
            },
            {
                value: AdoptionStatus.APPROVED,
                label: 'Approved',
                icon: '✅',
                description: 'Application approved, proceed to next steps',
                color: '#28a745'
            },
            {
                value: AdoptionStatus.REJECTED,
                label: 'Rejected',
                icon: '❌',
                description: 'Application not approved',
                color: '#dc3545'
            },
            {
                value: AdoptionStatus.IN_PROGRESS,
                label: 'In Progress',
                icon: '🔄',
                description: 'Adoption process actively moving forward',
                color: '#007bff'
            },
            {
                value: AdoptionStatus.COMPLETED,
                label: 'Completed',
                icon: '🎉',
                description: 'Adoption successfully finalized',
                color: '#28a745'
            },
            {
                value: AdoptionStatus.CANCELLED,
                label: 'Cancelled',
                icon: '🚫',
                description: 'Adoption process cancelled',
                color: '#6c757d'
            },
            {
                value: AdoptionStatus.ON_HOLD,
                label: 'On Hold',
                icon: '⏸️',
                description: 'Adoption temporarily paused',
                color: '#ffc107'
            }
        ];
    }

    /**
     * Test real-time notification (for development/testing)
     */
    async testRealTimeNotification(title?: string, message?: string, broadcast?: boolean): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/notifications/test-realtime`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title || 'Test Real-time Notification',
                    message: message || 'This is a test of the real-time notification system',
                    broadcast: broadcast || false
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Real-time test notification sent:', result);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error testing real-time notification:', error);
            return false;
        }
    }
}

export const adoptionNotificationService = new AdoptionNotificationService();
export default adoptionNotificationService;
