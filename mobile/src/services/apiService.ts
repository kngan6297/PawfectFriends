import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginFormData, RegisterFormData, AuthResponse, ApiResponse } from '@/types';
import { apiEndpoints, errorMessages } from '@/constants';

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000',
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor to add auth token
        this.api.interceptors.request.use(
            async (config) => {
                const token = await AsyncStorage.getItem('auth_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor to handle errors
        this.api.interceptors.response.use(
            (response: AxiosResponse) => response,
            async (error) => {
                if (error.response?.status === 401) {
                    // Token expired or invalid
                    await AsyncStorage.removeItem('auth_token');
                    await AsyncStorage.removeItem('user');
                    // You might want to redirect to login here
                }
                return Promise.reject(error);
            }
        );
    }

    async get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
        try {
            const response = await this.api.get(url, { params });
            return response.data;
        } catch (error: any) {
            return this.handleError(error);
        }
    }

    async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
        try {
            const response = await this.api.post(url, data);
            return response.data;
        } catch (error: any) {
            return this.handleError(error);
        }
    }

    async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
        try {
            const response = await this.api.put(url, data);
            return response.data;
        } catch (error: any) {
            return this.handleError(error);
        }
    }

    async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
        try {
            const response = await this.api.patch(url, data);
            return response.data;
        } catch (error: any) {
            return this.handleError(error);
        }
    }

    async delete<T = any>(url: string): Promise<ApiResponse<T>> {
        try {
            const response = await this.api.delete(url);
            return response.data;
        } catch (error: any) {
            return this.handleError(error);
        }
    }

    private handleError(error: any): ApiResponse {
        if (error.response) {
            // Server responded with error status
            return {
                success: false,
                message: error.response.data?.message || errorMessages.server,
                error: error.response.data,
            };
        } else if (error.request) {
            // Network error
            return {
                success: false,
                message: errorMessages.network,
                error: error.message,
            };
        } else {
            // Other error
            return {
                success: false,
                message: error.message || 'An unexpected error occurred',
                error: error,
            };
        }
    }
}

export const apiService = new ApiService();
