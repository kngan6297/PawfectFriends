import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './apiService';

export interface NotificationSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    adoptionUpdates: boolean;
    newPets: boolean;
    reminders: boolean;
}

export interface PrivacySettings {
    profileVisibility: 'public' | 'private';
    showEmail: boolean;
    showPhone: boolean;
    allowMessages: boolean;
}

export interface AppSettings {
    theme: 'light' | 'dark' | 'system';
    language: 'en' | 'vi';
    autoRefresh: boolean;
    cacheImages: boolean;
}

export interface SettingsData {
    notifications: NotificationSettings;
    privacy: PrivacySettings;
    app: AppSettings;
}

const SETTINGS_STORAGE_KEY = 'user_settings';

const defaultSettings: SettingsData = {
    notifications: {
        emailNotifications: true,
        pushNotifications: true,
        adoptionUpdates: true,
        newPets: true,
        reminders: false,
    },
    privacy: {
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        allowMessages: true,
    },
    app: {
        theme: 'system',
        language: 'en',
        autoRefresh: true,
        cacheImages: true,
    },
};

export const settingsService = {
    /**
     * Load settings from AsyncStorage
     */
    async loadSettings(): Promise<SettingsData> {
        try {
            const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
            if (storedSettings) {
                return JSON.parse(storedSettings);
            }
            return defaultSettings;
        } catch (error) {
            console.error('Failed to load settings:', error);
            return defaultSettings;
        }
    },

    /**
     * Save settings to AsyncStorage
     */
    async saveSettings(settings: SettingsData): Promise<void> {
        try {
            await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
            throw error;
        }
    },

    /**
     * Update specific settings section
     */
    async updateSettingsSection<K extends keyof SettingsData>(
        section: K,
        updates: Partial<SettingsData[K]>
    ): Promise<SettingsData> {
        try {
            const currentSettings = await this.loadSettings();
            const updatedSettings = {
                ...currentSettings,
                [section]: {
                    ...currentSettings[section],
                    ...updates,
                },
            };
            await this.saveSettings(updatedSettings);
            return updatedSettings;
        } catch (error) {
            console.error('Failed to update settings section:', error);
            throw error;
        }
    },

    /**
     * Reset settings to default
     */
    async resetSettings(): Promise<void> {
        try {
            await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
        } catch (error) {
            console.error('Failed to reset settings:', error);
            throw error;
        }
    },

    /**
     * Sync settings with backend (if API endpoints exist)
     */
    async syncWithBackend(settings: SettingsData): Promise<void> {
        try {
            // TODO: Implement API calls when backend endpoints are available
            // await apiService.put('/api/user/settings', settings);
            console.log('Settings synced with backend:', settings);
        } catch (error) {
            console.error('Failed to sync settings with backend:', error);
            throw error;
        }
    },

    /**
     * Load settings from backend
     */
    async loadFromBackend(): Promise<SettingsData> {
        try {
            // TODO: Implement API call when backend endpoint is available
            // const response = await apiService.get('/api/user/settings');
            // return response.data;
            return defaultSettings;
        } catch (error) {
            console.error('Failed to load settings from backend:', error);
            return defaultSettings;
        }
    },
};
