import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthInitialization = () => {
    const { setUser, setToken, setLoading } = useAuthStore();

    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);

            try {
                // Check for stored token
                const token = await AsyncStorage.getItem('auth_token');
                const userStr = await AsyncStorage.getItem('user');

                if (token && userStr) {
                    const user = JSON.parse(userStr);

                    // Validate token with server
                    try {
                        const response = await authService.validateToken();
                        if (response.success) {
                            setUser(user);
                            setToken(token);
                        } else {
                            // Token is invalid, clear storage
                            await AsyncStorage.removeItem('auth_token');
                            await AsyncStorage.removeItem('user');
                        }
                    } catch (error) {
                        // Token validation failed, clear storage
                        await AsyncStorage.removeItem('auth_token');
                        await AsyncStorage.removeItem('user');
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, [setUser, setToken, setLoading]);

    return { isLoading: useAuthStore((state) => state.isLoading) };
};
