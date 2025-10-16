import { api } from './api';

export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

import { NotificationData } from '@/types/call';

import { CallNotificationData } from '@/types/call';

export interface MessageNotificationData extends NotificationData {
    type: 'new_message';
    senderId: string;
    senderName: string;
    message: string;
    conversationID: string;
    data: {
        senderId: string;
        senderName: string;
        message: string;
        conversationID: string;
    };
}

class PushNotificationService {
    private registration: ServiceWorkerRegistration | null = null;
    private subscription: PushSubscription | null = null;
    private isSupported: boolean = false;
    private isInitialized: boolean = false;
    private notificationPermission: NotificationPermission = 'default';

    constructor() {
        this.checkSupport();
    }

    /**
     * Check if push notifications are supported
     */
    private checkSupport(): void {
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        console.log('[PUSH] Push notifications supported:', this.isSupported);
    }

    /**
     * Initialize the push notification service
     */
    async initialize(): Promise<boolean> {
        if (!this.isSupported) {
            console.warn('[PUSH] Push notifications not supported');
            return false;
        }

        try {
            // Register service worker
            this.registration = await navigator.serviceWorker.register('/sw.js');
            console.log('[PUSH] Service Worker registered:', this.registration);

            // Check notification permission
            this.notificationPermission = await this.requestPermission();

            if (this.notificationPermission === 'granted') {
                // Get existing subscription or create new one
                this.subscription = await this.getOrCreateSubscription();

                if (this.subscription) {
                    // Send subscription to server
                    await this.sendSubscriptionToServer(this.subscription);
                }
            }

            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

            this.isInitialized = true;
            console.log('[PUSH] Push notification service initialized');
            return true;

        } catch (error) {
            console.error('[PUSH] Failed to initialize push notification service:', error);
            return false;
        }
    }

    /**
     * Request notification permission
     */
    private async requestPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            console.warn('[PUSH] Notifications not supported');
            return 'denied';
        }

        if (Notification.permission === 'granted') {
            return 'granted';
        }

        if (Notification.permission === 'denied') {
            console.warn('[PUSH] Notification permission denied');
            return 'denied';
        }

        try {
            const permission = await Notification.requestPermission();
            console.log('[PUSH] Notification permission:', permission);
            return permission;
        } catch (error) {
            console.error('[PUSH] Error requesting notification permission:', error);
            return 'denied';
        }
    }

    /**
     * Get existing push subscription or create new one
     */
    private async getOrCreateSubscription(): Promise<PushSubscription | null> {
        if (!this.registration) {
            console.error('[PUSH] Service Worker not registered');
            return null;
        }

        try {
            // Check for existing subscription
            let subscription = await this.registration.pushManager.getSubscription();

            if (!subscription) {
                // Create new subscription
                subscription = await this.registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY || '')
                });
                console.log('[PUSH] New push subscription created');
            } else {
                console.log('[PUSH] Existing push subscription found');
            }

            return subscription;

        } catch (error) {
            console.error('[PUSH] Error getting/creating push subscription:', error);
            return null;
        }
    }

    /**
     * Send subscription to server
     */
    private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
        try {
            const subscriptionData: PushSubscription = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')!))),
                    auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')!)))
                }
            };

            await api.post('/notifications/subscribe', subscriptionData);
            console.log('[PUSH] Subscription sent to server');

        } catch (error) {
            console.error('[PUSH] Failed to send subscription to server:', error);
        }
    }

    /**
     * Convert VAPID public key to Uint8Array
     */
    private urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    /**
     * Handle messages from service worker
     */
    private handleServiceWorkerMessage(event: MessageEvent): void {
        console.log('[PUSH] Message from Service Worker:', event.data);

        const { type, data } = event.data;

        switch (type) {
            case 'accept_call':
                this.handleAcceptCall(data);
                break;

            case 'decline_call':
                this.handleDeclineCall(data);
                break;

            default:
                console.log('[PUSH] Unknown message type:', type);
        }
    }

    /**
     * Handle accept call from notification
     */
    private handleAcceptCall(data: any): void {
        console.log('[PUSH] Accepting call from notification:', data);

        // Dispatch custom event for call acceptance
        const event = new CustomEvent('acceptCallFromNotification', { detail: data });
        window.dispatchEvent(event);
    }

    /**
     * Handle decline call from notification
     */
    private handleDeclineCall(data: any): void {
        console.log('[PUSH] Declining call from notification:', data);

        // Dispatch custom event for call decline
        const event = new CustomEvent('declineCallFromNotification', { detail: data });
        window.dispatchEvent(event);
    }

    /**
     * Show local notification
     */
    async showNotification(notificationData: NotificationData): Promise<void> {
        if (!this.isInitialized || this.notificationPermission !== 'granted') {
            console.warn('[PUSH] Cannot show notification - not initialized or permission denied');
            return;
        }

        try {
            if (this.registration) {
                await this.registration.showNotification(notificationData.title, {
                    body: notificationData.body,
                    icon: notificationData.icon || '/favicon.ico',
                    badge: notificationData.badge || '/favicon.ico',
                    tag: 'pawfect-friends-notification',
                    data: notificationData.data || notificationData,
                    actions: notificationData.actions || [],
                    requireInteraction: notificationData.requireInteraction || false,
                    silent: notificationData.silent || false,
                    vibrate: notificationData.vibrate || [200, 100, 200],
                    sound: notificationData.sound || null,
                    dir: notificationData.dir || 'ltr',
                    lang: notificationData.lang || 'en',
                    renotify: notificationData.renotify || true,
                    image: notificationData.image || null,
                    timestamp: notificationData.timestamp || Date.now()
                });
                console.log('[PUSH] Local notification shown:', notificationData.title);
            }
        } catch (error) {
            console.error('[PUSH] Failed to show local notification:', error);
        }
    }

    /**
     * Show incoming call notification
     */
    async showIncomingCallNotification(callData: {
        callType: 'voice' | 'video';
        callerId: string;
        callerName: string;
        roomID: string;
    }): Promise<void> {
        const notificationData: CallNotificationData = {
            type: 'incoming_call',
            title: 'Incoming Call',
            body: `Incoming ${callData.callType} call from ${callData.callerName}`,
            icon: '/icons/incoming-call.png',
            requireInteraction: true,
            actions: [
                {
                    action: 'accept_call',
                    title: 'Accept',
                    icon: '/icons/accept-call.png'
                },
                {
                    action: 'decline_call',
                    title: 'Decline',
                    icon: '/icons/decline-call.png'
                }
            ],
            data: callData
        };

        await this.showNotification(notificationData);
    }

    /**
     * Show new message notification
     */
    async showNewMessageNotification(messageData: {
        senderId: string;
        senderName: string;
        message: string;
        conversationID: string;
    }): Promise<void> {
        const notificationData: MessageNotificationData = {
            type: 'new_message',
            title: `New message from ${messageData.senderName}`,
            body: messageData.message,
            icon: '/icons/new-message.png',
            requireInteraction: false,
            data: messageData
        };

        await this.showNotification(notificationData);
    }

    /**
     * Clear all notifications
     */
    async clearNotifications(): Promise<void> {
        if (this.registration) {
            const notifications = await this.registration.getNotifications();
            notifications.forEach(notification => notification.close());
            console.log('[PUSH] All notifications cleared');
        }
    }

    /**
     * Update subscription on server
     */
    async updateSubscription(): Promise<void> {
        if (this.subscription) {
            await this.sendSubscriptionToServer(this.subscription);
        }
    }

    /**
     * Unsubscribe from push notifications
     */
    async unsubscribe(): Promise<void> {
        try {
            if (this.subscription) {
                await this.subscription.unsubscribe();
                this.subscription = null;
                console.log('[PUSH] Unsubscribed from push notifications');
            }

            // Notify server about unsubscribe
            await api.post('/notifications/unsubscribe');

        } catch (error) {
            console.error('[PUSH] Failed to unsubscribe:', error);
        }
    }

    /**
     * Check if push notifications are supported and initialized
     */
    isReady(): boolean {
        return this.isSupported && this.isInitialized && this.notificationPermission === 'granted';
    }

    /**
     * Get current subscription
     */
    getSubscription(): PushSubscription | null {
        return this.subscription;
    }

    /**
     * Get notification permission status
     */
    getPermissionStatus(): NotificationPermission {
        return this.notificationPermission;
    }
}

// Create singleton instance
export const pushNotificationService = new PushNotificationService(); 