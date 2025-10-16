import { LoginFormData, RegisterFormData, AuthServiceResponse } from '../types/auth';
import { api } from './api';
import { parseApiError } from '../utils/error-handler';

// Enhanced result type with field errors
type LoginResult = {
    success: boolean;
    status?: number;
    userMessage?: string;
    message?: string;
    fieldErrors?: Record<string, string>;
    data?: any;
    userRole?: string;
    error?: any;
};

export const authService = {
    async login(data: LoginFormData): Promise<LoginResult> {
        try {
            const response = await api.post('/api/auth/login', {
                emailOrPhone: data.emailOrPhone,
                password: data.password
            });

            return {
                success: true,
                ...response.data
            };
        } catch (error: any) {
            // Handle axios errors and network issues
            if (error.response) {
                // Server responded with error status
                const data = error.response.data || {};
                const { userMessage, fieldErrors } = parseApiError(data);

                return {
                    success: false,
                    status: error.response.status,
                    userMessage,
                    fieldErrors,
                    ...data
                };
            } else if (error.request) {
                // Network error - no response received
                return {
                    success: false,
                    userMessage: "Network error. Please check your connection and try again.",
                    message: "Network error",
                    error: error.message
                };
            } else {
                // Other error
                return {
                    success: false,
                    userMessage: "An unexpected error occurred. Please try again.",
                    message: error.message || "Unknown error",
                    error: error
                };
            }
        }
    },

    async register(data: RegisterFormData): Promise<LoginResult> {
        try {
            const response = await api.post('/api/auth/register', data);
            return {
                success: true,
                ...response.data
            };
        } catch (error: any) {
            // Handle axios errors and network issues
            if (error.response) {
                // Server responded with error status
                const data = error.response.data || {};
                const { userMessage, fieldErrors } = parseApiError(data);

                return {
                    success: false,
                    status: error.response.status,
                    userMessage,
                    fieldErrors,
                    ...data
                };
            } else if (error.request) {
                // Network error - no response received
                return {
                    success: false,
                    userMessage: "Network error. Please check your connection and try again.",
                    message: "Network error",
                    error: error.message
                };
            } else {
                // Other error
                return {
                    success: false,
                    userMessage: "An unexpected error occurred. Please try again.",
                    message: error.message || "Unknown error",
                    error: error
                };
            }
        }
    },

    logout(): void {
        // No need to remove token from localStorage since we're using cookies
        localStorage.removeItem('user');
    },

    getCurrentUser(): any {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            this.logout(); // Clear any invalid data
            return null;
        }
    },

    getToken(): string | null {
        try {
            return localStorage.getItem('token');
        } catch (error) {
            return null;
        }
    }
}; 