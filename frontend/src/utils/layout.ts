/**
 * Utility functions for responsive layout calculations
 */

/**
 * Calculate the number of skeleton items needed to fill the grid layout
 * This ensures the skeleton loading state matches the actual grid appearance
 */
export const calculateSkeletonCount = (
    maxResults?: number,
    gridColumns: number = 3,
    defaultRows: number = 2
): number => {
    // If maxResults is specified, use that
    if (maxResults && maxResults > 0) {
        return maxResults;
    }

    // Calculate skeleton count based on grid columns and desired rows
    // This creates a more realistic loading experience
    return gridColumns * defaultRows;
};

/**
 * Get the optimal skeleton count for different screen sizes
 * This creates a more realistic loading experience
 */
export const getResponsiveSkeletonCount = (): number => {
    // Default to 6 which works well across all breakpoints:
    // - Mobile (1 col): 6 items = 6 rows
    // - Tablet (2 cols): 6 items = 3 rows  
    // - Desktop (3 cols): 6 items = 2 rows
    return 6;
};

/**
 * Calculate skeleton count based on grid columns and desired rows
 */
export const calculateSkeletonByGrid = (
    columns: number,
    rows: number = 2
): number => {
    return columns * rows;
};
