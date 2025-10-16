import { api } from '../services/api';

interface ViewTrackingOptions {
    minStayTime?: number; // Minimum time user must stay on page (default: 3 seconds)
    debounceTime?: number; // Debounce time for rapid navigation (default: 1 second)
    maxViewsPerSession?: number; // Maximum views per session (default: 10)
}

class ViewTracker {
    private static instance: ViewTracker;
    private trackedShelters: Set<string> = new Set();
    private viewTimers: Map<string, NodeJS.Timeout> = new Map();
    private sessionViews: Map<string, number> = new Map();
    private defaultOptions: Required<ViewTrackingOptions> = {
        minStayTime: 3000, // 3 seconds
        debounceTime: 1000, // 1 second
        maxViewsPerSession: 10,
    };

    private constructor() {
        // Initialize session storage for view tracking
        this.loadSessionData();
    }

    static getInstance(): ViewTracker {
        if (!ViewTracker.instance) {
            ViewTracker.instance = new ViewTracker();
        }
        return ViewTracker.instance;
    }

    private loadSessionData(): void {
        try {
            const sessionData = sessionStorage.getItem('viewTracker');
            if (sessionData) {
                const data = JSON.parse(sessionData);
                this.trackedShelters = new Set(data.trackedShelters || []);
                this.sessionViews = new Map(Object.entries(data.sessionViews || {}));
            }
        } catch (error) {
            console.warn('Failed to load view tracker session data:', error);
        }
    }

    private saveSessionData(): void {
        try {
            const sessionData = {
                trackedShelters: Array.from(this.trackedShelters),
                sessionViews: Object.fromEntries(this.sessionViews),
            };
            sessionStorage.setItem('viewTracker', JSON.stringify(sessionData));
        } catch (error) {
            console.warn('Failed to save view tracker session data:', error);
        }
    }

    /**
     * Track a shelter view with debouncing and minimum stay time
     * @param shelterId - The shelter ID to track
     * @param options - Tracking options
     */
    async trackShelterView(
        shelterId: string,
        options: ViewTrackingOptions = {}
    ): Promise<void> {
        const opts = { ...this.defaultOptions, ...options };

        // Check if we've already tracked this shelter in this session
        if (this.trackedShelters.has(shelterId)) {
            console.log(`Shelter ${shelterId} already tracked in this session`);
            return;
        }

        // Check session view limits
        const currentViews = this.sessionViews.get(shelterId) || 0;
        if (currentViews >= opts.maxViewsPerSession) {
            console.log(`Maximum views per session reached for shelter ${shelterId}`);
            return;
        }

        // Clear any existing timer for this shelter
        if (this.viewTimers.has(shelterId)) {
            clearTimeout(this.viewTimers.get(shelterId)!);
        }

        // Set a timer to track the view after minimum stay time
        const timer = setTimeout(async () => {
            try {
                await this.incrementShelterView(shelterId);

                // Mark as tracked and update session data
                this.trackedShelters.add(shelterId);
                this.sessionViews.set(shelterId, currentViews + 1);
                this.saveSessionData();

                console.log(`Successfully tracked view for shelter ${shelterId}`);
            } catch (error) {
                console.error('Failed to track shelter view:', error);
            }
        }, opts.minStayTime);

        this.viewTimers.set(shelterId, timer);
    }

    /**
     * Cancel tracking for a shelter (e.g., when user navigates away quickly)
     * @param shelterId - The shelter ID to cancel tracking for
     */
    cancelTracking(shelterId: string): void {
        const timer = this.viewTimers.get(shelterId);
        if (timer) {
            clearTimeout(timer);
            this.viewTimers.delete(shelterId);
            console.log(`Cancelled tracking for shelter ${shelterId}`);
        }
    }

    /**
     * Force track a shelter view (for testing or special cases)
     * @param shelterId - The shelter ID to track
     */
    async forceTrackShelterView(shelterId: string): Promise<void> {
        try {
            await this.incrementShelterView(shelterId);
            console.log(`Force tracked view for shelter ${shelterId}`);
        } catch (error) {
            console.error('Failed to force track shelter view:', error);
        }
    }

    /**
     * Reset session data (useful for testing or clearing limits)
     */
    resetSession(): void {
        this.trackedShelters.clear();
        this.sessionViews.clear();
        this.viewTimers.forEach(timer => clearTimeout(timer));
        this.viewTimers.clear();
        sessionStorage.removeItem('viewTracker');
        console.log('View tracker session reset');
    }

    /**
     * Get current session statistics
     */
    getSessionStats(): {
        trackedShelters: string[];
        sessionViews: Record<string, number>;
        activeTimers: number;
    } {
        return {
            trackedShelters: Array.from(this.trackedShelters),
            sessionViews: Object.fromEntries(this.sessionViews),
            activeTimers: this.viewTimers.size,
        };
    }

    private async incrementShelterView(shelterId: string): Promise<void> {
        try {
            const response = await api.post(`/shelters/${shelterId}/view`);

            if (response.data.status === 'success') {
                console.log(`View incremented for shelter ${shelterId}:`, response.data.data);
            } else {
                console.warn(`View increment response:`, response.data);
            }
        } catch (error: any) {
            if (error.response?.status === 429) {
                console.warn('Rate limit exceeded for view increment');
            } else {
                console.error('Error incrementing shelter view:', error);
            }
            throw error;
        }
    }
}

// Export singleton instance
export const viewTracker = ViewTracker.getInstance();

// Export the class for testing
export { ViewTracker };

// Export types
export type { ViewTrackingOptions }; 