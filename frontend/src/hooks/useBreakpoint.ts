import { useState, useEffect } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface BreakpointConfig {
    sm: number;  // 640px
    md: number;  // 768px
    lg: number;  // 1024px
    xl: number;  // 1280px
    '2xl': number; // 1536px
}

const breakpoints: BreakpointConfig = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
};

/**
 * Custom hook to detect current breakpoint
 * Returns the current breakpoint and grid columns for that breakpoint
 */
export const useBreakpoint = () => {
    const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');
    const [gridColumns, setGridColumns] = useState(3);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;

            if (width >= breakpoints['2xl']) {
                setBreakpoint('2xl');
                setGridColumns(3); // Keep 3 columns for very large screens
            } else if (width >= breakpoints.xl) {
                setBreakpoint('xl');
                setGridColumns(3);
            } else if (width >= breakpoints.lg) {
                setBreakpoint('lg');
                setGridColumns(3);
            } else if (width >= breakpoints.md) {
                setBreakpoint('md');
                setGridColumns(2);
            } else {
                setBreakpoint('sm');
                setGridColumns(1);
            }
        };

        // Set initial breakpoint
        handleResize();

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return { breakpoint, gridColumns };
};
