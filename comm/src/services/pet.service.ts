import { authService } from './auth.service';

export interface PetInfo {
    _id: string;
    name: string;
    type: 'dog' | 'cat' | 'bird' | 'other';
    breed?: string;
    breeds?: {
        primary: string;
        secondary?: string;
    };
    age: 'baby' | 'young' | 'adult' | 'senior';
    gender: 'male' | 'female' | 'unknown';
    size: 'small' | 'medium' | 'large';
    description: string;
    photos: Array<{
        url: string;
        caption?: string;
    }>;
    status: 'adoptable' | 'pending' | 'adopted' | 'hidden';
    shelter: {
        _id: string;
        name: string;
        location?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export class PetService {
    private config = {
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.pawfectfriends.xyz/api',
    };

    /**
     * Get pet information by ID
     */
    async getPetById(petId: string): Promise<PetInfo | null> {
        try {
            const token = authService.getAuthToken();
            if (!token) {
                console.warn('No auth token available for pet service');
                return null;
            }

            const response = await fetch(`${this.config.apiBaseUrl}/pets/${petId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error('Failed to fetch pet:', response.status, response.statusText);
                return null;
            }

            const data = await response.json();

            if (data.success && data.data) {
                return data.data;
            } else {
                console.error('Invalid pet data response:', data);
                return null;
            }
        } catch (error) {
            console.error('Error fetching pet information:', error);
            return null;
        }
    }

    /**
     * Get multiple pets by IDs
     */
    async getPetsByIds(petIds: string[]): Promise<PetInfo[]> {
        try {
            const token = authService.getAuthToken();
            if (!token) {
                console.warn('No auth token available for pet service');
                return [];
            }

            const response = await fetch(`${this.config.apiBaseUrl}/pets/batch`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ petIds }),
            });

            if (!response.ok) {
                console.error('Failed to fetch pets:', response.status, response.statusText);
                return [];
            }

            const data = await response.json();

            if (data.success && Array.isArray(data.data)) {
                return data.data;
            } else {
                console.error('Invalid pets data response:', data);
                return [];
            }
        } catch (error) {
            console.error('Error fetching pets information:', error);
            return [];
        }
    }

    /**
     * Format pet display name
     */
    formatPetName(pet: PetInfo): string {
        const breed = pet.breed || pet.breeds?.primary || 'Unknown breed';
        return `${pet.name} (${breed})`;
    }

    /**
     * Get pet age with emoji
     */
    getPetAgeEmoji(age: string): string {
        switch (age) {
            case 'baby': return '👶';
            case 'young': return '🧒';
            case 'adult': return '👤';
            case 'senior': return '👴';
            default: return '🐾';
        }
    }

    /**
     * Get pet gender emoji
     */
    getPetGenderEmoji(gender: string): string {
        switch (gender) {
            case 'male': return '♂️';
            case 'female': return '♀️';
            default: return '❓';
        }
    }

    /**
     * Get pet size emoji
     */
    getPetSizeEmoji(size: string): string {
        switch (size) {
            case 'small': return '🐕';
            case 'medium': return '🐕‍🦺';
            case 'large': return '🐕‍🦺';
            default: return '🐾';
        }
    }
}

export const petService = new PetService();
