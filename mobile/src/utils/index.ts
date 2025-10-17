// Utility functions for the mobile app

export const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const formatDateTime = (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatDisplayDate = (date: string | Date): string => {
    const d = new Date(date);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone);
};

export const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
};

export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};

export const capitalizeFirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const capitalizeWords = (str: string): string => {
    return str.replace(/\w\S*/g, (txt) =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
};

export const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const isNetworkError = (error: any): boolean => {
    return error?.code === 'NETWORK_ERROR' || error?.message?.includes('network');
};

export const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.response?.data?.message) return error.response.data.message;
    return 'An unexpected error occurred';
};

export const isValidToken = (t?: string | null): boolean => {
    return typeof t === 'string' && t.trim().length > 0 && t !== 'null' && t !== 'undefined';
};

// Pet utilities
export const petId = (pet: any): string => {
    return pet.id ?? pet._id ?? Math.random().toString();
};