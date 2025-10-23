// Integration configuration for PawfectFriends communication app

export interface IntegrationConfig {
    // Main app configuration
    mainAppUrl: string;
    mainAppPort: number;

    // Communication app configuration
    communicationPort: number;

    // API endpoints
    apiBaseUrl: string;
    authEndpoint: string;
    userProfileEndpoint: string;

    // WebSocket configuration
    wsUrl: string;

    // Cross-app communication
    enableCrossAppNavigation: boolean;
    sharedStorageKey: string;

    // Feature flags
    enableVoiceCalls: boolean;
    enableVideoCalls: boolean;
    enableFileSharing: boolean;
    enableGroupChats: boolean;
}

// Development configuration
export const devConfig: IntegrationConfig = {
    mainAppUrl: 'http://localhost',
    mainAppPort: parseInt(import.meta.env.VITE_MAIN_APP_PORT || '5173'), // Use env var or default to 5173
    communicationPort: parseInt(import.meta.env.VITE_COMMUNICATION_PORT || '3000'), // Use env var or default to 3000
    apiBaseUrl: 'http://localhost:5000/api', // Backend API
    authEndpoint: '/auth',
    userProfileEndpoint: '/users/profile',
    wsUrl: 'ws://localhost:5000',
    enableCrossAppNavigation: true,
    sharedStorageKey: 'pawfect-friends-auth',
    enableVoiceCalls: true,
    enableVideoCalls: true,
    enableFileSharing: true,
    enableGroupChats: true,
};

// Production configuration
export const prodConfig: IntegrationConfig = {
    mainAppUrl: import.meta.env.VITE_MAIN_APP_URL || 'https://pawfectfriends.xyz',
    mainAppPort: 443,
    communicationPort: parseInt(import.meta.env.VITE_COMMUNICATION_PORT || '3000'),
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.pawfectfriends.xyz',
    authEndpoint: '/auth',
    userProfileEndpoint: '/users/profile',
    wsUrl: import.meta.env.VITE_WS_URL || 'wss://api.pawfectfriends.xyz',
    enableCrossAppNavigation: true,
    sharedStorageKey: 'pawfect-friends-auth',
    enableVoiceCalls: true,
    enableVideoCalls: true,
    enableFileSharing: true,
    enableGroupChats: true,
};

// Get current configuration based on environment
export const getIntegrationConfig = (): IntegrationConfig => {
    return import.meta.env.DEV ? devConfig : prodConfig;
};

// Utility functions for cross-app communication
export const crossAppUtils = {
    // Get authentication token from shared storage
    getAuthToken(): string | null {
        const config = getIntegrationConfig();
        const authData = localStorage.getItem(config.sharedStorageKey);
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
    },

    // Set authentication token in shared storage
    setAuthToken(token: string): void {
        const config = getIntegrationConfig();
        localStorage.setItem(config.sharedStorageKey, token);
    },

    // Navigate to main app
    navigateToMainApp(path: string = '/'): void {
        const config = getIntegrationConfig();
        if (config.enableCrossAppNavigation) {
            window.open(`${config.mainAppUrl}:${config.mainAppPort}${path}`, '_blank');
        }
    },

    // Get user profile from main app
    async getUserProfile(): Promise<any> {
        const config = getIntegrationConfig();
        const token = this.getAuthToken();

        if (!token) {
            throw new Error('No authentication token found');
        }

        try {
            const response = await fetch(`${config.apiBaseUrl}${config.userProfileEndpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    },

    // Get user data from shared storage
    getUserData(): any | null {
        const config = getIntegrationConfig();
        const authData = localStorage.getItem(config.sharedStorageKey);
        if (authData) {
            try {
                return JSON.parse(authData);
            } catch (e) {
                console.error('Error parsing user data:', e);
                return null;
            }
        }
        return null;
    },

    // Check if user is authenticated
    isAuthenticated(): boolean {
        return !!this.getAuthToken();
    },

    // Logout and clear shared storage
    logout(): void {
        const config = getIntegrationConfig();
        localStorage.removeItem(config.sharedStorageKey);
        // Redirect to main app login
        this.navigateToMainApp('/login');
    },
};

export default getIntegrationConfig;
