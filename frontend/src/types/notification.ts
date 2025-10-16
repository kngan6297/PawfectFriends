export interface NotificationData {
    adoptionRequestId?: string;
    petId?: string;

    reviewId?: string;
    meetingId?: string;
    documentId?: string;
    status?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    actionUrl?: string;
    actionText?: string;
}

export interface NotificationSentVia {
    type: 'in_app' | 'email' | 'push' | 'sms';
    sentAt: Date;
    status: 'pending' | 'sent' | 'delivered' | 'failed';
}

export interface Notification {
    _id: string;
    recipient: string;
    sender?: {
        _id: string;
        name: string;
        avatar?: string;
    };
    type: 'adoption_request' | 'adoption_status_change' | 'new_message' | 'pet_status_change' | 'review_received' | 'system_alert' | 'reminder' | 'meeting_scheduled' | 'document_uploaded' | 'profile_view';
    title: string;
    message: string;
    data: NotificationData;
    isRead: boolean;
    isArchived: boolean;
    readAt?: Date;
    expiresAt?: Date;
    sentVia: NotificationSentVia[];
    createdAt: Date;
    updatedAt: Date;
}

export interface NotificationResponse {
    notifications: Notification[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface UnreadCountResponse {
    unreadCount: number;
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