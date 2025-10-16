import { apiService } from './apiService';
import { LoginFormData, RegisterFormData, AuthResponse } from '@/types';
import { apiEndpoints } from '@/constants';

export const authService = {
    async login(data: LoginFormData): Promise<AuthResponse> {
        return apiService.post(apiEndpoints.auth.login, data);
    },

    async register(data: RegisterFormData): Promise<AuthResponse> {
        return apiService.post(apiEndpoints.auth.register, data);
    },

    async logout(): Promise<void> {
        await apiService.post(apiEndpoints.auth.logout);
    },

    async verifyEmail(token: string): Promise<AuthResponse> {
        return apiService.get(`${apiEndpoints.auth.verifyEmail}?token=${token}`);
    },

    async resendVerification(email: string): Promise<AuthResponse> {
        return apiService.post(apiEndpoints.auth.resendVerification, { email });
    },

    async forgotPassword(email: string): Promise<AuthResponse> {
        return apiService.post(apiEndpoints.auth.forgotPassword, { email });
    },

    async resetPassword(token: string, password: string, confirmPassword: string): Promise<AuthResponse> {
        return apiService.post(apiEndpoints.auth.resetPassword, {
            token,
            password,
            confirmPassword,
        });
    },

    async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<AuthResponse> {
        return apiService.put(apiEndpoints.auth.changePassword, {
            currentPassword,
            newPassword,
            confirmPassword,
        });
    },

    async validateToken(): Promise<AuthResponse> {
        return apiService.get('/api/auth/validate-token');
    },
};
