export const PAGE_MAX = 420; // can be 400–440 as desired
export const GUTTER = 16;

// Common spacing values
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
} as const;

// Common padding patterns
export const PADDING = {
    horizontal: GUTTER,
    vertical: GUTTER,
    small: SPACING.sm,
    medium: SPACING.md,
    large: SPACING.lg,
} as const;

// Common margin patterns
export const MARGIN = {
    top: {
        small: SPACING.sm,
        medium: SPACING.md,
        large: SPACING.lg,
        xlarge: SPACING.xl,
    },
    bottom: {
        small: SPACING.sm,
        medium: SPACING.md,
        large: SPACING.lg,
        xlarge: SPACING.xl,
    },
} as const;

// Container styles
export const pageContainer = {
    width: "100%" as const,
    maxWidth: PAGE_MAX,
    alignSelf: "center" as const,
};

export const scrollContent = {
    paddingTop: SPACING.sm,
    paddingBottom: 72,
    // center the inner container 
    alignItems: "center" as const,
};

// Common content container styles
export const contentContainer = {
    paddingHorizontal: GUTTER,
    paddingTop: SPACING.sm,
    paddingBottom: 56,
    maxWidth: PAGE_MAX,
    width: "100%",
    alignSelf: "center" as const,
};

// Section spacing
export const sectionSpacing = {
    small: SPACING.md,
    medium: SPACING.lg,
    large: SPACING.xl,
} as const;
