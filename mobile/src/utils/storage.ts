import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
    async getItem(key: string): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(key);
        } catch (error) {
            console.error('Error getting item from storage:', error);
            return null;
        }
    },

    async setItem(key: string, value: string): Promise<void> {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            console.error('Error setting item in storage:', error);
        }
    },

    async removeItem(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing item from storage:', error);
        }
    },

    async clear(): Promise<void> {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    },

    async getObject<T>(key: string): Promise<T | null> {
        try {
            const item = await AsyncStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error getting object from storage:', error);
            return null;
        }
    },

    async setObject<T>(key: string, value: T): Promise<void> {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error setting object in storage:', error);
        }
    },
};
