import { useEffect, useRef } from 'react';

/**
 * Custom hook for debounced effects with proper cleanup
 * @param effect - The effect function to run after the delay
 * @param deps - Dependencies array for the effect
 * @param delay - Delay in milliseconds before running the effect
 */
export const useDebouncedEffect = (
    effect: () => void,
    deps: React.DependencyList,
    delay: number
) => {
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout
        timeoutRef.current = setTimeout(effect, delay);

        // Cleanup function for this effect
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, deps);

    // Cleanup on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
};
