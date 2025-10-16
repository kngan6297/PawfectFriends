import { getIntegrationConfig } from '../config/integration';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    token?: string;
    user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        avatar?: string;
    };
}

export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
    phone?: string;
    address?: string;
    preferences?: any;
}

class AuthService {
    private config = getIntegrationConfig();

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await fetch(`${this.config.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (response.ok && data.token) {
                // Store token in shared storage with proper format
                const authData = {
                    userId: data.user.id,
                    userName: `${data.user.firstName} ${data.user.lastName}`,
                    userAvatar: data.user.avatar,
                    userRole: data.user.role,
                    token: data.token,
                    timestamp: Date.now(),
                };
                localStorage.setItem(this.config.sharedStorageKey, JSON.stringify(authData));

                // Store user info in session storage for ZIM
                sessionStorage.setItem('ZIMDEMOUSER', JSON.stringify({
                    userID: data.user.id,
                    userName: `${data.user.firstName} ${data.user.lastName}`,
                    email: data.user.email,
                    role: data.user.role,
                    avatar: data.user.avatar
                }));

                return {
                    success: true,
                    message: 'Login successful',
                    token: data.token,
                    user: data.user
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Login failed'
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Network error. Please try again.'
            };
        }
    }

    async register(userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }): Promise<AuthResponse> {
        try {
            const response = await fetch(`${this.config.apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    message: 'Registration successful. Please login.',
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Registration failed'
                };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: 'Network error. Please try again.'
            };
        }
    }

    async getUserProfile(): Promise<UserProfile | null> {
        try {
            const token = this.getAuthToken();
            if (!token) return null;

            const response = await fetch(`${this.config.apiBaseUrl}/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    }

    getAuthToken(): string | null {
        const authData = localStorage.getItem(this.config.sharedStorageKey);
        if (authData) {
            try {
                const parsed = JSON.parse(authData);
                return parsed.token || null;
            } catch (e) {
                console.error('Error parsing auth data:', e);
                return null;
            }
        }
        return null;
    }

    isAuthenticated(): boolean {
        return !!this.getAuthToken();
    }

    getUserData(): any | null {
        const authData = localStorage.getItem(this.config.sharedStorageKey);
        if (authData) {
            try {
                return JSON.parse(authData);
            } catch (e) {
                console.error('Error parsing user data:', e);
                return null;
            }
        }
        return null;
    }

    logout(): void {
        localStorage.removeItem(this.config.sharedStorageKey);
        sessionStorage.removeItem('ZIMDEMOUSER');

        // Redirect to main app login
        window.location.href = `${this.config.mainAppUrl}:${this.config.mainAppPort}/login`;
    }

    async refreshToken(): Promise<boolean> {
        try {
            const token = this.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Get existing auth data and update token
                const existingAuthData = this.getUserData();
                if (existingAuthData) {
                    existingAuthData.token = data.token;
                    existingAuthData.timestamp = Date.now();
                    localStorage.setItem(this.config.sharedStorageKey, JSON.stringify(existingAuthData));
                } else {
                    // Fallback: store just the token if no existing data
                    localStorage.setItem(this.config.sharedStorageKey, JSON.stringify({ token: data.token }));
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Token refresh error:', error);
            return false;
        }
    }
}

export const authService = new AuthService();
export default authService;
