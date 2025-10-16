import { api } from './api';
import { fetchRTCToken } from '../api/rtc';
import {
    ZIMTokenResponse,
    ZIMRoomResponse,
    ZIMConfigResponse,
    ZIMMessage,
    ZIMChatRoom,
} from '@/types/chat';

class ZIMClient {
    private appID: number;

    constructor() {
        this.appID = parseInt(import.meta.env.VITE_ZEGO_APP_ID || '0');
    }

    /**
     * Initialize ZIM client with configuration
     */
    async initialize(): Promise<boolean> {
        try {
            const config = await this.getConfig();
            this.appID = config.appID;
            return true;
        } catch (error) {
            console.error('Failed to initialize ZIM client:', error);
            return false;
        }
    }

    /**
     * Generate token for joining a chat room
     */
    async generateToken(params: { userId: string; scene: 'chat' | 'call'; ttl?: number }): Promise<ZIMTokenResponse> {
        try {
            // Use the unified RTC token endpoint
            const response = await api.post('/api/rtc/token', {
                type: 'zim',
                userId: params.userId,
                ttl: params.ttl || 7200, // Default to 2 hours
            });

            // The unified endpoint returns JSON with token data
            const token = response.data.data.token;

            // Validate that we have a Token04 (should start with "04")
            if (!token || !token.startsWith('04')) {
                throw new Error('Bad ZIM token (not Token04)');
            }

            return {
                token,
                userId: params.userId,
                roomId: '*', // ZIM tokens are global for chat
                appID: this.appID,
                expiresIn: params.ttl || 7200,
            };
        } catch (error: any) {
            console.error('ZIM token generation failed:', error);
            throw new Error(`Failed to generate ZIM token: ${error.message}`);
        }
    }

    /**
     * Create a new chat room
     */
    async createRoom(roomType: 'direct' | 'group' = 'direct', participants: string[] = [], name?: string): Promise<ZIMRoomResponse> {
        try {
            // For ZIM, we'll use the unified token API to create a room context
            const tokenData = await this.generateToken({
                userId: participants[0] || 'default',
                scene: 'chat',
                ttl: 7200,
            });
            return {
                roomId: `room_${Date.now()}`,
                roomType,
                token: tokenData.token,
                createdBy: participants[0] || 'default',
                participants,
                appID: tokenData.appID,
                shareLink: `https://example.com/room/${Date.now()}`,
            };
        } catch (error: any) {
            console.error('Failed to create ZIM room:', error);
            throw new Error(`Failed to create chat room: ${error.message}`);
        }
    }

    /**
     * Join an existing chat room
     */
    async joinRoom(roomId: string, userId: string, privilege = 1): Promise<ZIMTokenResponse> {
        try {
            // For ZIM, we'll use the unified token API to join a room
            const tokenData = await this.generateToken({
                userId,
                scene: 'chat',
                ttl: 7200,
            });
            return {
                roomId,
                token: tokenData.token,
                userId,
                appID: tokenData.appID,
                expiresIn: 7200,
            };
        } catch (error: any) {
            console.error('Failed to join ZIM room:', error);
            throw new Error(`Failed to join chat room: ${error.message}`);
        }
    }

    /**
     * Leave a chat room
     */
    async leaveRoom(roomId: string): Promise<void> {
        // For Zego, leaving a room is handled client-side
        // No backend call needed
        console.log(`Left room: ${roomId}`);
    }

    /**
     * Get chat room information
     */
    async getRoomInfo(roomId: string): Promise<ZIMRoomResponse> {
        // For Zego, room info is managed client-side
        // Return mock data for now
        return {
            roomId,
            roomType: 'direct',
            token: '',
            createdBy: 'unknown',
            participants: [],
            appID: this.appID,
            shareLink: `https://example.com/room/${roomId}`,
        };
    }

    /**
     * Get chat room participants
     */
    async getRoomParticipants(roomId: string): Promise<string[]> {
        // For Zego, participants are managed client-side
        // Return empty array for now
        return [];
    }

    /**
     * Add participant to chat room
     */
    async addParticipant(roomId: string, participantId: string): Promise<void> {
        // For Zego, adding participants is handled client-side
        console.log(`Added participant ${participantId} to room ${roomId}`);
    }

    /**
     * Remove participant from chat room
     */
    async removeParticipant(roomId: string, participantId: string): Promise<void> {
        // For Zego, removing participants is handled client-side
        console.log(`Removed participant ${participantId} from room ${roomId}`);
    }

    /**
     * Get ZIM configuration
     */
    async getConfig(): Promise<{ appID: number }> {
        // For ZIM, we'll fetch the token when needed instead of storing appSign
        return {
            appID: this.appID,
        };
    }

    /**
     * Health check for chat service
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await api.get('/api/rtc/health');
            return response.data.success;
        } catch (error) {
            console.error('RTC service health check failed:', error);
            return false;
        }
    }

    /**
     * Get chat room statistics
     */
    async getRoomStats(roomId: string): Promise<{
        messageCount: number;
        participantCount: number;
        lastActivity: Date;
    }> {
        // For Zego, room stats are managed client-side
        // Return mock data for now
        return {
            messageCount: 0,
            participantCount: 0,
            lastActivity: new Date(),
        };
    }

    /**
     * Search chat messages
     */
    async searchMessages(roomId: string, query: string, options: {
        page?: number;
        limit?: number;
        startDate?: Date;
        endDate?: Date;
    } = {}): Promise<{
        messages: ZIMMessage[];
        total: number;
        page: number;
        limit: number;
    }> {
        // For Zego, message search is managed client-side
        // Return mock data for now
        return {
            messages: [],
            total: 0,
            page: options.page || 1,
            limit: options.limit || 10,
        };
    }

    /**
     * Get app configuration
     */
    getAppConfig() {
        return {
            appID: this.appID,
        };
    }
}

export const zimClient = new ZIMClient();
export default zimClient;
