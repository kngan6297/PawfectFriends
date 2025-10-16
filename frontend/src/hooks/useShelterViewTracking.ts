import { useEffect, useRef } from 'react';
import { viewTracker, ViewTrackingOptions } from '../utils/viewTracker';

interface UseShelterViewTrackingOptions extends ViewTrackingOptions {
    enabled?: boolean; // Whether tracking is enabled (default: true)
    trackOnMount?: boolean; // Whether to track on component mount (default: true)
    trackOnFocus?: boolean; // Whether to track when window gains focus (default: false)
}

/**
 * React hook for tracking shelter views with debouncing and session management
 * @param shelterId - The shelter ID to track
 * @param options - Tracking options
 */
export const useShelterViewTracking = (
    shelterId: string,
    options: UseShelterViewTrackingOptions = {}
) => {
    const {
        enabled = true,
        trackOnMount = true,
        trackOnFocus = false,
        ...trackingOptions
    } = options;

    const isTrackingRef = useRef(false);
    const hasTrackedRef = useRef(false);

    // Track view on mount
    useEffect(() => {
        if (!enabled || !trackOnMount || hasTrackedRef.current) {
            return;
        }

        const trackView = async () => {
            if (isTrackingRef.current) return;

            isTrackingRef.current = true;
            try {
                await viewTracker.trackShelterView(shelterId, trackingOptions);
                hasTrackedRef.current = true;
            } catch (error) {
                console.error('Failed to track shelter view:', error);
            } finally {
                isTrackingRef.current = false;
            }
        };

        // Small delay to ensure component is fully mounted
        const timer = setTimeout(trackView, 100);

        return () => {
            clearTimeout(timer);
            viewTracker.cancelTracking(shelterId);
        };
    }, [shelterId, enabled, trackOnMount, trackingOptions]);

    // Track view on window focus (optional)
    useEffect(() => {
        if (!enabled || !trackOnFocus) {
            return;
        }

        const handleFocus = async () => {
            if (hasTrackedRef.current) return;

            try {
                await viewTracker.trackShelterView(shelterId, trackingOptions);
                hasTrackedRef.current = true;
            } catch (error) {
                console.error('Failed to track shelter view on focus:', error);
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [shelterId, enabled, trackOnFocus, trackingOptions]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            viewTracker.cancelTracking(shelterId);
        };
    }, [shelterId]);

    // Manual tracking function
    const trackView = async () => {
        if (!enabled || hasTrackedRef.current) return;

        try {
            await viewTracker.trackShelterView(shelterId, trackingOptions);
            hasTrackedRef.current = true;
        } catch (error) {
            console.error('Failed to manually track shelter view:', error);
        }
    };

    // Force tracking function (ignores session limits)
    const forceTrackView = async () => {
        if (!enabled) return;

        try {
            await viewTracker.forceTrackShelterView(shelterId);
        } catch (error) {
            console.error('Failed to force track shelter view:', error);
        }
    };

    return {
        trackView,
        forceTrackView,
        isTracking: isTrackingRef.current,
        hasTracked: hasTrackedRef.current,
    };
};

export default useShelterViewTracking; 