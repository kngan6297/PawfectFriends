import { getIntegrationConfig } from '../config/integration';
import { authService } from './auth.service';

export interface PetChatRoom {
    id: string;
    conversationId: string;
    type: PetChatType;
    name: string;
    description: string;
    avatar?: string;
    category: PetCategory;
    tags: string[];
    participants: string[];
    moderators: string[];
    rules: string[];
    isPublic: boolean;
    maxParticipants?: number;
    lastMessage?: any;
    unreadCount: number;
    memberCount: number;
    createdAt: string;
    updatedAt: string;
}

export enum PetChatType {
    ADOPTION_DISCUSSION = 'adoption_discussion',
    SHELTER_UPDATES = 'shelter_updates',
    PET_CARE_TIPS = 'pet_care_tips',
    BREED_SPECIFIC = 'breed_specific',
    EMERGENCY_SUPPORT = 'emergency_support',
    SUCCESS_STORIES = 'success_stories',
    VOLUNTEER_COORDINATION = 'volunteer_coordination'
}

export enum PetCategory {
    DOGS = 'dogs',
    CATS = 'cats',
    SMALL_ANIMALS = 'small_animals',
    BIRDS = 'birds',
    REPTILES = 'reptiles',
    FARM_ANIMALS = 'farm_animals',
    EXOTIC = 'exotic',
    ALL_PETS = 'all_pets'
}

export interface CreatePetChatRoomRequest {
    type: PetChatType;
    name: string;
    description: string;
    category: PetCategory;
    tags: string[];
    rules: string[];
    isPublic: boolean;
    maxParticipants?: number;
    avatar?: string;
}

export interface PetChatMessage extends Message {
    petInfo?: {
        petId?: string;
        petName?: string;
        petType?: string;
        petBreed?: string;
        petAge?: number;
        petStatus?: 'available' | 'adopted' | 'pending' | 'reserved';
    };
    messageType: 'general' | 'adoption_inquiry' | 'shelter_update' | 'care_tip' | 'emergency' | 'success_story';
    urgency?: 'low' | 'medium' | 'high' | 'urgent';
    location?: string;
    contactInfo?: {
        phone?: string;
        email?: string;
        preferredContact?: string;
    };
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    type: number;
    content: string;
    messageSeq: number;
    orderKey: number;
    timestamp: number;
    status: number;
    replyToMessageId?: string;
    customData?: any;
    attachments?: any[];
    createdAt: string;
    updatedAt: string;
}

export interface PetChatFilters {
    category?: PetCategory;
    type?: PetChatType;
    tags?: string[];
    location?: string;
    isPublic?: boolean;
    hasAvailablePets?: boolean;
}

class PetChatService {
    private config = getIntegrationConfig();

    /**
     * Create a new pet chat room
     */
    async createPetChatRoom(data: CreatePetChatRoomRequest): Promise<PetChatRoom | null> {
        try {
            const token = authService.getAuthToken();
            if (!token) return null;

            const response = await fetch(`${this.config.apiBaseUrl}/pet-chat-rooms`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error creating pet chat room:', error);
            return null;
        }
    }

    /**
     * Get all pet chat rooms with optional filtering
     */
    async getPetChatRooms(filters: PetChatFilters = {}): Promise<PetChatRoom[]> {
        try {
            const token = authService.getAuthToken();
            if (!token) return [];

            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(v => params.append(key, v));
                    } else {
                        params.append(key, value.toString());
                    }
                }
            });

            const response = await fetch(`${this.config.apiBaseUrl}/pet-chat-rooms?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error fetching pet chat rooms:', error);
            return [];
        }
    }

    /**
     * Get pet chat room by ID
     */
    async getPetChatRoom(roomId: string): Promise<PetChatRoom | null> {
        try {
            const token = authService.getAuthToken();
            if (!token) return null;

            const response = await fetch(`${this.config.apiBaseUrl}/pet-chat-rooms/${roomId}`, {
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
            console.error('Error fetching pet chat room:', error);
            return null;
        }
    }

    /**
     * Join a pet chat room
     */
    async joinPetChatRoom(roomId: string): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/pet-chat-rooms/${roomId}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Error joining pet chat room:', error);
            return false;
        }
    }

    /**
     * Leave a pet chat room
     */
    async leavePetChatRoom(roomId: string): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/pet-chat-rooms/${roomId}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Error leaving pet chat room:', error);
            return false;
        }
    }

    /**
     * Get available pet categories
     */
    getPetCategories(): { value: PetCategory; label: string; icon: string }[] {
        return [
            { value: PetCategory.DOGS, label: 'Dogs', icon: '🐕' },
            { value: PetCategory.CATS, label: 'Cats', icon: '🐱' },
            { value: PetCategory.SMALL_ANIMALS, label: 'Small Animals', icon: '🐰' },
            { value: PetCategory.BIRDS, label: 'Birds', icon: '🦜' },
            { value: PetCategory.REPTILES, label: 'Reptiles', icon: '🦎' },
            { value: PetCategory.FARM_ANIMALS, label: 'Farm Animals', icon: '🐷' },
            { value: PetCategory.EXOTIC, label: 'Exotic Pets', icon: '🦊' },
            { value: PetCategory.ALL_PETS, label: 'All Pets', icon: '🐾' }
        ];
    }

    /**
     * Get available chat room types
     */
    getChatRoomTypes(): { value: PetChatType; label: string; icon: string; description: string }[] {
        return [
            {
                value: PetChatType.ADOPTION_DISCUSSION,
                label: 'Adoption Discussion',
                icon: '🏠',
                description: 'Discuss pet adoption experiences and questions'
            },
            {
                value: PetChatType.SHELTER_UPDATES,
                label: 'Shelter Updates',
                icon: '🏥',
                description: 'Latest updates from local shelters and rescues'
            },
            {
                value: PetChatType.PET_CARE_TIPS,
                label: 'Pet Care Tips',
                icon: '💡',
                description: 'Share and learn pet care best practices'
            },
            {
                value: PetChatType.BREED_SPECIFIC,
                label: 'Breed Specific',
                icon: '🐕‍🦺',
                description: 'Breed-specific discussions and advice'
            },
            {
                value: PetChatType.EMERGENCY_SUPPORT,
                label: 'Emergency Support',
                icon: '🚨',
                description: 'Urgent pet care and emergency situations'
            },
            {
                value: PetChatType.SUCCESS_STORIES,
                label: 'Success Stories',
                icon: '🎉',
                description: 'Share adoption and rescue success stories'
            },
            {
                value: PetChatType.VOLUNTEER_COORDINATION,
                label: 'Volunteer Coordination',
                icon: '🤝',
                description: 'Coordinate volunteer efforts and events'
            }
        ];
    }

    /**
     * Get popular tags for pet chat rooms
     */
    getPopularTags(): string[] {
        return [
            'puppy', 'kitten', 'senior', 'special-needs', 'foster', 'rescue',
            'training', 'health', 'behavior', 'nutrition', 'exercise', 'grooming',
            'vaccination', 'spay-neuter', 'microchip', 'lost-found', 'reunited',
            'foster-to-adopt', 'temporary-foster', 'long-term-foster'
        ];
    }

    /**
     * Search pet chat rooms
     */
    async searchPetChatRooms(query: string, filters: PetChatFilters = {}): Promise<PetChatRoom[]> {
        try {
            const token = authService.getAuthToken();
            if (!token) return [];

            const searchParams = new URLSearchParams();
            searchParams.append('q', query);
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(v => searchParams.append(key, v));
                    } else {
                        searchParams.append(key, value.toString());
                    }
                }
            });

            const response = await fetch(`${this.config.apiBaseUrl}/pet-chat-rooms/search?${searchParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error searching pet chat rooms:', error);
            return [];
        }
    }

    /**
     * Get trending pet chat rooms
     */
    async getTrendingPetChatRooms(limit: number = 10): Promise<PetChatRoom[]> {
        try {
            const token = authService.getAuthToken();
            if (!token) return [];

            const response = await fetch(`${this.config.apiBaseUrl}/pet-chat-rooms/trending?limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error fetching trending pet chat rooms:', error);
            return [];
        }
    }

    /**
     * Update pet chat room
     */
    async updatePetChatRoom(roomId: string, updates: Partial<PetChatRoom>): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/pet-chat-rooms/${roomId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });

            return response.ok;
        } catch (error) {
            console.error('Error updating pet chat room:', error);
            return false;
        }
    }

    /**
     * Delete pet chat room
     */
    async deletePetChatRoom(roomId: string): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/pet-chat-rooms/${roomId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Error deleting pet chat room:', error);
            return false;
        }
    }
}

export const petChatService = new PetChatService();
export default petChatService;
