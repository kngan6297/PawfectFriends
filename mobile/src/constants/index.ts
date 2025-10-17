// Theme Colors
export const colors = {
    // Primary colors
    primary: '#7C3AED', // violet-600
    primaryLight: '#A78BFA', // violet-300
    primaryDark: '#5B21B6', // violet-700

    // Secondary colors
    secondary: '#4ECDC4',
    secondaryLight: '#7EDDD6',
    secondaryDark: '#3BA39C',

    // Neutral colors
    background: '#FFFFFF',
    surface: '#F8F9FA',
    card: '#FFFFFF',

    // Text colors
    text: '#2C3E50',
    textSecondary: '#7F8C8D',
    textLight: '#BDC3C7',

    // Status colors
    success: '#27AE60',
    warning: '#F39C12',
    error: '#E74C3C',
    info: '#3498DB',

    // Border and divider
    border: '#E1E8ED',
    divider: '#E1E8ED',

    // Shadow
    shadow: 'rgba(0, 0, 0, 0.1)',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Pet type colors
    dog: '#8B4513',
    cat: '#FFA500',
    other: '#9370DB',
};

// Spacing
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// Border radius
export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
};

// Font sizes
export const fontSize = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

// Font weights
export const fontWeight = {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
};

// Shadows
export const shadows = {
    sm: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    lg: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
};

// Animation durations
export const animationDuration = {
    fast: 200,
    normal: 300,
    slow: 500,
};

// Screen dimensions
export const screenDimensions = {
    padding: spacing.md,
    headerHeight: 56,
    tabBarHeight: 60,
};

// Pet filters
export const petFilters = {
    types: ['dog', 'cat', 'other'] as const,
    ages: ['baby', 'young', 'adult', 'senior'] as const,
    genders: ['male', 'female', 'unknown'] as const,
    sizes: ['small', 'medium', 'large'] as const,
};

// Adoption statuses
export const adoptionStatuses = {
    pending: 'Pending',
    approved: 'Approved',
    scheduled: 'Scheduled',
    completed: 'Completed',
    rejected: 'Rejected',
} as const;

// Adoption status badge palette
export const adoptionStatusBadges = {
    submitted: { label: 'Submitted', bg: '#FEF3C7', fg: '#92400E' },
    reviewing: { label: 'Reviewing', bg: '#E0E7FF', fg: '#3730A3' },
    approved: { label: 'Approved', bg: '#DCFCE7', fg: '#166534' },
    declined: { label: 'Declined', bg: '#FEE2E2', fg: '#991B1B' },
} as const;

// Validation constants
export const validation = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\d\s\-\+\(\)]+$/,
    passwordMinLength: 8,
    nameMinLength: 2,
    nameMaxLength: 50,
};

// API endpoints
export const apiEndpoints = {
    auth: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        logout: '/api/auth/logout',
        verifyEmail: '/api/auth/verify-email',
        resendVerification: '/api/auth/resend-verification',
        forgotPassword: '/api/auth/forgot-password',
        resetPassword: '/api/auth/reset-password',
        changePassword: '/api/auth/change-password',
    },
    pets: {
        list: '/api/pets',
        search: '/api/pets/search',
        latest: '/api/pets/latest',
        byId: (id: string) => `/api/pets/${id}`,
        bySlug: (slug: string) => `/api/pets/slug/${slug}`,
    },
    users: {
        profile: '/api/users/profile',
        favorites: '/api/favorites',
        viewedPets: '/api/users/viewed-pets',
        preferences: '/api/users/preferences',
        avatar: '/api/users/avatar',
    },
    adoptions: {
        list: '/api/adoptions',
        user: '/api/adoptions/user',
        create: (petId: string) => `/api/adoptions/${petId}`,
        byId: (id: string) => `/api/adoptions/${id}`,
        meetings: (id: string) => `/api/adoptions/${id}/meetings`,
        notes: (id: string) => `/api/adoptions/${id}/notes`,
    },
    shelters: {
        list: '/api/shelters',
        byId: (id: string) => `/api/shelters/${id}`,
    },
    notifications: {
        list: '/api/notifications',
        unreadCount: '/api/notifications/unread-count',
        markAsRead: (id: string) => `/api/notifications/${id}/read`,
        markAllRead: '/api/notifications/mark-all-read',
        delete: (id: string) => `/api/notifications/${id}`,
        archive: (id: string) => `/api/notifications/${id}/archive`,
        settings: '/api/notifications/settings',
        test: '/api/notifications/test',
        testRealtime: '/api/notifications/test-realtime',
    },
};

// Storage keys
export const storageKeys = {
    authToken: 'auth_token',
    user: 'user',
    preferences: 'preferences',
    onboarding: 'onboarding_completed',
};

// Error messages
export const errorMessages = {
    network: 'Network error. Please check your connection.',
    server: 'Server error. Please try again later.',
    auth: {
        invalidCredentials: 'Invalid email/phone or password.',
        emailNotVerified: 'Please verify your email address.',
        accountLocked: 'Account is locked. Please contact support.',
        tokenExpired: 'Session expired. Please login again.',
    },
    validation: {
        required: 'This field is required.',
        email: 'Please enter a valid email address.',
        phone: 'Please enter a valid phone number.',
        password: 'Password must be at least 8 characters.',
        passwordMatch: 'Passwords do not match.',
        name: 'Name must be between 2 and 50 characters.',
    },
    pet: {
        notFound: 'Pet not found.',
        alreadyAdopted: 'This pet has already been adopted.',
    },
    adoption: {
        alreadyExists: 'You have already submitted an adoption request for this pet.',
        notFound: 'Adoption request not found.',
        cannotCancel: 'Cannot cancel this adoption request.',
    },
};

// Success messages
export const successMessages = {
    auth: {
        login: 'Welcome back!',
        register: 'Account created successfully!',
        emailSent: 'Verification email sent!',
        passwordReset: 'Password reset email sent!',
        passwordChanged: 'Password changed successfully!',
    },
    pet: {
        favorited: 'Added to favorites!',
        unfavorited: 'Removed from favorites!',
    },
    adoption: {
        submitted: 'Adoption request submitted successfully!',
        updated: 'Adoption request updated!',
    },
    profile: {
        updated: 'Profile updated successfully!',
        avatarUpdated: 'Profile picture updated!',
    },
};
