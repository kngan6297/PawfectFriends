import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse } from '@/types';
import { authService } from '@/services/authService';
import { Platform } from 'react-native';
import { isValidToken } from '@/utils';

// Unified storage keys
const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'user';
const PERSIST_KEY = 'auth-storage';

// Old keys to clean up
const OLD_KEYS = [
    'pf-auth',
    'access_token',
    // Note: 'auth-storage' is the current persist key, so we don't clean it up
];

// Clean up old storage keys once at initialization
const cleanupOldKeys = () => {
    try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            OLD_KEYS.forEach(key => {
                if (localStorage.getItem(key)) {
                    console.log(`Cleaning up old storage key: ${key}`);
                    localStorage.removeItem(key);
                }
            });
        } else if (Platform.OS !== 'web') {
            OLD_KEYS.forEach(async key => {
                try {
                    const value = await AsyncStorage.getItem(key);
                    if (value) {
                        console.log(`Cleaning up old storage key: ${key}`);
                        await AsyncStorage.removeItem(key);
                    }
                } catch (error) {
                    console.warn(`Failed to clean up old key ${key}:`, error);
                }
            });
        }
    } catch (error) {
        console.warn('Failed to clean up old storage keys:', error);
    }
};

// Run cleanup once
cleanupOldKeys();

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

interface AuthActions {
    login: (emailOrPhone: string, password: string) => Promise<AuthResponse>;
    register: (data: any) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
    persist(
        (set, get) => ({
            // State
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true, // Start with loading true to prevent premature redirects
            error: null,

            // Actions
            login: async (emailOrPhone: string, password: string) => {
                set({ isLoading: true, error: null });

                try {
                    console.log("Attempting login with:", { emailOrPhone });
                    const response = await authService.login({ emailOrPhone, password });
                    console.log("Login response:", response);

                    if (response.success && response.data) {
                        console.log("Login successful, setting auth state");
                        set({
                            user: response.data.user,
                            token: response.data.accessToken || response.data.token,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null,
                        });
                        get().setToken(response.data.accessToken || response.data.token || null); // ✅ ensure both persist + removable storage are saved
                        // Store user data in AsyncStorage for consistency
                        if (Platform.OS === 'web') {
                            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data.user));
                        } else {
                            await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data.user));
                        }
                        console.log("Auth state updated successfully");
                    } else {
                        console.log("Login failed:", response.message);
                        set({
                            isLoading: false,
                            error: response.message || 'Login failed',
                        });
                    }

                    return response;
                } catch (error: any) {
                    console.log("Login error:", error);
                    const errorMessage = error.message || 'Login failed';
                    set({
                        isLoading: false,
                        error: errorMessage,
                    });
                    return {
                        success: false,
                        message: errorMessage,
                    };
                }
            },

            register: async (data: any) => {
                set({ isLoading: true, error: null });

                try {
                    const response = await authService.register(data);

                    if (response.success && response.data) {
                        set({
                            user: response.data.user,
                            token: response.data.accessToken || response.data.token,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null,
                        });
                        get().setToken(response.data.accessToken || response.data.token || null); // ✅ ensure both persist + removable storage are saved
                        // Store user data in AsyncStorage for consistency
                        if (Platform.OS === 'web') {
                            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data.user));
                        } else {
                            await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data.user));
                        }
                    } else {
                        set({
                            isLoading: false,
                            error: response.message || 'Registration failed',
                        });
                    }

                    return response;
                } catch (error: any) {
                    const errorMessage = error.message || 'Registration failed';
                    set({
                        isLoading: false,
                        error: errorMessage,
                    });
                    return {
                        success: false,
                        message: errorMessage,
                    };
                }
            },

            logout: async () => {
                // First, try to call the logout API while token is still available
                try {
                    await authService.logout();
                } catch (error) {
                    // Ignore logout API errors - we still want to clear local state
                    console.log('Logout API call failed, but continuing with local logout');
                }

                // Then clear local state
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    error: null,
                });

                // Clear AsyncStorage token
                if (Platform.OS === 'web') {
                    localStorage.removeItem(AUTH_TOKEN_KEY);
                    localStorage.removeItem(AUTH_USER_KEY);
                } else {
                    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
                    await AsyncStorage.removeItem(AUTH_USER_KEY);
                }
            },

            setUser: (user: User | null) => {
                set({ user, isAuthenticated: !!user });
            },

            setToken: (token: string | null) => {
                set({ token, isAuthenticated: !!token });
                // Also store in AsyncStorage for API service
                if (Platform.OS === 'web') {
                    if (token) {
                        localStorage.setItem(AUTH_TOKEN_KEY, token);
                    } else {
                        localStorage.removeItem(AUTH_TOKEN_KEY);
                    }
                } else {
                    if (token) {
                        AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
                    } else {
                        AsyncStorage.removeItem(AUTH_TOKEN_KEY);
                    }
                }
            },

            setLoading: (loading: boolean) => {
                set({ isLoading: loading });
            },

            setError: (error: string | null) => {
                set({ error });
            },

            clearError: () => {
                set({ error: null });
            },

            updateUser: (userData: Partial<User>) => {
                const currentUser = get().user;
                if (currentUser) {
                    set({ user: { ...currentUser, ...userData } });
                }
            },

        }),
        {
            name: PERSIST_KEY,
            version: 2,
            migrate: async (persisted: any, currentVersion) => {
                if (!persisted) return persisted;
                if (currentVersion < 2) {
                    const st = persisted.state ?? persisted; // depends on persist structure
                    if (st && (!isValidToken(st.token))) {
                        st.token = null;
                        st.isAuthenticated = false;
                    }
                }
                return persisted;
            },
            storage: createJSONStorage(() => (Platform.OS === 'web' ? localStorage : AsyncStorage)),
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.error("Failed to rehydrate auth store:", error);
                    return;
                }
                if (!state) return;

                console.log("Rehydrating state:", {
                    user: state.user?.email,
                    token: state.token,
                    isAuthenticated: state.isAuthenticated
                });

                // 1) Normalize the token
                if (!isValidToken(state.token)) {
                    console.log("Token invalid, setting to null");
                    state.token = null;
                }

                // 2) If the token is missing but external storage has it, restore
                try {
                    if (!isValidToken(state.token)) {
                        if (Platform.OS === 'web') {
                            const t = localStorage.getItem(AUTH_TOKEN_KEY);
                            console.log("Fallback token from localStorage:", t);
                            if (isValidToken(t)) {
                                console.log("Restoring token from localStorage");
                                state.token = t!;
                            }
                        } else {
                            // AsyncStorage in RN is async; in onRehydrateStorage you can only set sync.
                            // Solution: don't restore async here; instead, add a small effect in the root app to read again.
                        }
                    }
                } catch (e) {
                    console.log("Fallback token read failed:", e);
                }

                // 3) Determine authenticated valid when both user and token are valid
                const hasValidAuth = !!(state.user && isValidToken(state.token));
                state.isAuthenticated = hasValidAuth;
                state.isLoading = false;

                console.log("Auth store rehydrated:", {
                    isAuthenticated: state.isAuthenticated,
                    user: state.user?.email,
                    token: isValidToken(state.token) ? "present" : "missing"
                });
            },
        }
    )
);
